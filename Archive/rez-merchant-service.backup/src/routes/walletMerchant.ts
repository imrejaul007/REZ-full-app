// @ts-nocheck
/**
 * DUAL PAYOUT FIX (2026-04-16):
 *
 * This file is the SOLE canonical path for merchant withdrawals.
 *
 * PREVIOUS ISSUE: Two parallel paths existed:
 *   Path A: payouts.ts  -> writes to `payouts` collection, validates against settlements, NO wallet debit
 *   Path B: walletMerchant.ts -> debits MerchantWallet, NO settlement validation
 *
 * Both wrote to different collections and had no mutual exclusion, enabling double-payout:
 * a merchant could exhaust wallet via Path B, then still request via Path A beyond available balance.
 *
 * FIX: This file (Path B) is now the canonical withdrawal path. It:
 *   1. Validates against SettlementService (same check as old Path A)
 *   2. Atomically debits MerchantWallet.balance.available
 *   3. Creates a WalletTransaction ledger entry
 *   4. Creates a Payout ledger entry for audit/ reconciliation
 *
 * Old Path A (payouts.ts POST /) is deprecated and forwards to this endpoint.
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { MerchantWallet } from '../models/MerchantWallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { Payout } from '../models/Payout';
import { AuditLog } from '../models/AuditLog';
import { SettlementService } from '../services/settlementService';
import { merchantAuth, requireVerifiedMerchant } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);
router.use(requireVerifiedMerchant);

router.get('/', async (req: Request, res: Response) => {
  try {
    let wallet = await MerchantWallet.findOne({ merchant: req.merchantId }).lean();
    if (!wallet) wallet = await MerchantWallet.create({ merchant: req.merchantId, balance: { available: 0, pending: 0, total: 0 } });
    res.json({ success: true, data: wallet });
  } catch (e: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const message = process.env.NODE_ENV === "production"
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message });
  }
});

router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const query: any = { merchantId: req.merchantId };
    if (req.query.type) query.type = req.query.type;
    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      WalletTransaction.countDocuments(query),
    ]);
    res.json({ success: true, data: { transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const message = process.env.NODE_ENV === "production"
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message });
  }
});

router.post('/withdraw', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    // DUAL-PAYOUT-FIX-01: Input validation with upper bounds and decimal precision
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ success: false, message: 'Valid positive amount required' });
      return;
    }
    if (!Number.isFinite(amount)) {
      res.status(400).json({ success: false, message: 'amount must be a valid finite number' });
      return;
    }
    if (amount > 9999999) {
      res.status(400).json({ success: false, message: 'amount exceeds maximum allowed payout (9,999,999)' });
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(String(amount))) {
      res.status(400).json({ success: false, message: 'amount must have at most 2 decimal places' });
      return;
    }

    // DUAL-PAYOUT-FIX-02: Settlement validation (prevents requesting more than earned minus fees/refunds)
    const settlementValidation = await SettlementService.validatePayoutAmount(req.merchantId as any, amount);
    if (!settlementValidation.valid) {
      res.status(400).json({
        success: false,
        message: settlementValidation.breakdown.reason,
        breakdown: settlementValidation.breakdown,
        maxAmount: settlementValidation.maxAmount,
      });
      return;
    }

    // DUAL-PAYOUT-FIX-03: Reject if a pending payout already exists (mutual exclusion)
    const existingPendingPayout = await Payout.findOne({
      merchantId: req.merchantId,
      status: 'pending',
    }).lean();
    if (existingPendingPayout) {
      res.status(409).json({
        success: false,
        message: 'A withdrawal is already pending. Please wait for it to be processed before requesting another.',
        existingPayoutId: (existingPendingPayout as any)._id,
      });
      return;
    }

    // MERCH-AUDIT-10: Wrap all financial writes in a MongoDB transaction to ensure atomicity.
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // DUAL-PAYOUT-FIX-04: Atomic check-and-debit against available wallet balance.
      // The $gte check inside findOneAndUpdate is the only place balance is validated —
      // all other checks above are pre-conditions that cannot prevent a race window.
      // MERCH-AUDIT-10 FIX: Also update total balance on withdrawal.
      const wallet = await MerchantWallet.findOneAndUpdate(
        { merchant: req.merchantId, 'balance.available': { $gte: amount } },
        { $inc: { 'balance.available': -amount, 'balance.pending': amount, 'balance.total': -amount } },
        { new: true, session },
      );
      if (!wallet) {
        await session.abortTransaction();
        res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance',
          maxAmount: wallet?.balance?.available ?? 0,
        });
        return;
      }

      // DUAL-PAYOUT-FIX-05: Create wallet transaction ledger entry
      const tx = await WalletTransaction.create(
        [{
          merchantId: req.merchantId,
          type: 'withdrawal',
          amount,
          status: 'pending',
          description: 'Withdrawal requested',
        }],
        { session },
      );

      // DUAL-PAYOUT-FIX-06: Create payout ledger entry for audit/reconciliation
      // This links the wallet transaction to the payout record so reconciliation
      // between wallettransactions and payouts collections is possible.
      const payout = await Payout.create(
        [{
          merchantId: req.merchantId,
          amount,
          status: 'pending',
          notes: `wallet_withdrawal:${(tx[0] as any)._id}`,
        }],
        { session },
      );

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        message: 'Withdrawal requested',
        data: {
          transactionId: (tx[0] as any)._id,
          payoutId: (payout[0] as any)._id,
          amount,
          status: 'pending',
        },
      });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (e: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const message = process.env.NODE_ENV === "production"
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message });
  }
});

router.put('/bank-details', async (req: Request, res: Response) => {
  try {
    const { accountNumber, ifscCode, accountHolderName, bankName, upiId } = req.body;
    if (!accountNumber || !ifscCode || !accountHolderName || !bankName) { res.status(400).json({ success: false, message: 'All bank fields required' }); return; }
    const bankDetails: Record<string, string> = { accountNumber, ifscCode, accountHolderName, bankName };
    if (upiId) bankDetails.upiId = upiId;
    await MerchantWallet.findOneAndUpdate({ merchant: req.merchantId }, { $set: { bankDetails } }, { upsert: true });

    // SEC-009 FIX: Audit log for bank details update
    await AuditLog.create({
      merchantId: new mongoose.Types.ObjectId(req.merchantId as string),
      merchantUserId: new mongoose.Types.ObjectId(req.merchantUserId as string),
      action: 'MERCHANT_BANK_DETAILS_UPDATE',
      resourceType: 'merchant_wallet',
      resourceId: req.merchantId,
      severity: 'high',
      details: { bankName, accountHolderName, maskedAccount: accountNumber.slice(-4).padStart(accountNumber.length, '*'), ip: req.ip, userAgent: req.headers['user-agent'] },
    });

    res.json({ success: true, message: 'Bank details updated' });
  } catch (e: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const message = process.env.NODE_ENV === "production"
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const wallet = await MerchantWallet.findOne({ merchant: req.merchantId }).lean();
    res.json({ success: true, data: wallet || { balance: { available: 0, pending: 0, total: 0 } } });
  } catch (e: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const message = process.env.NODE_ENV === "production"
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message });
  }
});

export default router;
