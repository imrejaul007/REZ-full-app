// @ts-nocheck
import { Router } from 'express';
import { authenticate as requireAuth, requireAdmin } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { BillProvider } from '../../models/BillProvider';
import { BillPayment } from '../../models/BillPayment';
import { sendSuccess } from '../../utils/response';

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

// ─── Provider CRUD ─────────────────────────────────────────────────────────

router.get(
  '/providers',
  asyncHandler(async (req, res) => {
    const { type, page = 1, limit = 50 } = req.query;
    const query: any = {};
    if (type) query.type = type;

    const [providers, total] = await Promise.all([
      BillProvider.find(query)
        .sort({ type: 1, displayOrder: 1 })
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .lean(),
      BillProvider.countDocuments(query),
    ]);

    sendSuccess(res, { providers, total });
  }),
);

router.post(
  '/providers',
  asyncHandler(async (req, res) => {
    const {
      name: bpName,
      code: bpCode,
      type: bpType,
      logo: bpLogo,
      region: bpRegion,
      requiredFields: bpReqFields,
      cashbackPercent: bpCashback,
      aggregatorCode: bpAggCode,
      aggregatorName: bpAggName,
      promoCoinsFixed: bpPromoCoins,
      promoExpiryDays: bpPromoExpiry,
      maxRedemptionPercent: bpMaxRedeem,
      displayOrder: bpDisplayOrder,
      isFeatured: bpIsFeatured,
      minAmount: bpMinAmt,
      maxAmount: bpMaxAmt,
      isActive: bpIsActive,
    } = req.body;
    const provider = await BillProvider.create({
      name: bpName,
      code: bpCode,
      type: bpType,
      logo: bpLogo,
      region: bpRegion,
      requiredFields: bpReqFields,
      cashbackPercent: bpCashback,
      aggregatorCode: bpAggCode,
      aggregatorName: bpAggName,
      promoCoinsFixed: bpPromoCoins,
      promoExpiryDays: bpPromoExpiry,
      maxRedemptionPercent: bpMaxRedeem,
      displayOrder: bpDisplayOrder,
      isFeatured: bpIsFeatured,
      minAmount: bpMinAmt,
      maxAmount: bpMaxAmt,
      isActive: bpIsActive,
    });
    sendSuccess(res, provider, 'Provider created', 201);
  }),
);

router.put(
  '/providers/:id',
  asyncHandler(async (req, res) => {
    const {
      name: bpUpName,
      code: bpUpCode,
      type: bpUpType,
      logo: bpUpLogo,
      region: bpUpRegion,
      requiredFields: bpUpReqFields,
      cashbackPercent: bpUpCashback,
      aggregatorCode: bpUpAggCode,
      aggregatorName: bpUpAggName,
      promoCoinsFixed: bpUpPromoCoins,
      promoExpiryDays: bpUpPromoExpiry,
      maxRedemptionPercent: bpUpMaxRedeem,
      displayOrder: bpUpDisplayOrder,
      isFeatured: bpUpIsFeatured,
      minAmount: bpUpMinAmt,
      maxAmount: bpUpMaxAmt,
      isActive: bpUpIsActive,
    } = req.body;
    const bpUpFields: Record<string, any> = {};
    if (bpUpName !== undefined) bpUpFields.name = bpUpName;
    if (bpUpCode !== undefined) bpUpFields.code = bpUpCode;
    if (bpUpType !== undefined) bpUpFields.type = bpUpType;
    if (bpUpLogo !== undefined) bpUpFields.logo = bpUpLogo;
    if (bpUpRegion !== undefined) bpUpFields.region = bpUpRegion;
    if (bpUpReqFields !== undefined) bpUpFields.requiredFields = bpUpReqFields;
    if (bpUpCashback !== undefined) bpUpFields.cashbackPercent = bpUpCashback;
    if (bpUpAggCode !== undefined) bpUpFields.aggregatorCode = bpUpAggCode;
    if (bpUpAggName !== undefined) bpUpFields.aggregatorName = bpUpAggName;
    if (bpUpPromoCoins !== undefined) bpUpFields.promoCoinsFixed = bpUpPromoCoins;
    if (bpUpPromoExpiry !== undefined) bpUpFields.promoExpiryDays = bpUpPromoExpiry;
    if (bpUpMaxRedeem !== undefined) bpUpFields.maxRedemptionPercent = bpUpMaxRedeem;
    if (bpUpDisplayOrder !== undefined) bpUpFields.displayOrder = bpUpDisplayOrder;
    if (bpUpIsFeatured !== undefined) bpUpFields.isFeatured = bpUpIsFeatured;
    if (bpUpMinAmt !== undefined) bpUpFields.minAmount = bpUpMinAmt;
    if (bpUpMaxAmt !== undefined) bpUpFields.maxAmount = bpUpMaxAmt;
    if (bpUpIsActive !== undefined) bpUpFields.isActive = bpUpIsActive;
    const provider = await BillProvider.findByIdAndUpdate(
      req.params.id,
      { $set: bpUpFields },
      { new: true, runValidators: true },
    );
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    sendSuccess(res, provider, 'Provider updated');
  }),
);

router.patch(
  '/providers/:id/toggle',
  asyncHandler(async (req, res) => {
    const provider = await BillProvider.findById(req.params.id);
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    provider.isActive = !provider.isActive;
    await provider.save();
    sendSuccess(res, { isActive: provider.isActive });
  }),
);

// ─── Transactions ──────────────────────────────────────────────────────────

router.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    const { status, billType, from, to, page = 1, limit = 20 } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (billType) query.billType = billType;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from as string);
      if (to) query.createdAt.$lte = new Date(to as string);
    }

    const [transactions, total] = await Promise.all([
      BillPayment.find(query)
        .populate('userId', 'name email phone')
        .populate('provider', 'name type logo')
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .lean(),
      BillPayment.countDocuments(query),
    ]);

    sendSuccess(res, { transactions, total });
  }),
);

// ─── Stats ─────────────────────────────────────────────────────────────────

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const [overview] = await BillPayment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          totalCoinsIssued: { $sum: '$promoCoinsIssued' },
          totalCashback: { $sum: '$cashbackAmount' },
          avgTransaction: { $avg: '$amount' },
        },
      },
    ]);

    const byType = await BillPayment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$billType', volume: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { volume: -1 } },
    ]);

    sendSuccess(res, { overview: overview || {}, byType });
  }),
);

// ─── Admin Refund ──────────────────────────────────────────────────────────
// NOTE: BBPS refunds are not processed automatically. This endpoint records
// the refund request and sets it to 'pending' so that the ops
// team can process the reversal through the BBPS operator portal manually.
// When an automated refund pipeline is available, replace the status update
// below with a call to that service and update the response message.

router.post(
  '/transactions/:id/refund',
  asyncHandler(async (req, res) => {
    const payment = await BillPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    if (payment.refundStatus === 'pending') {
      return res
        .status(409)
        .json({ success: false, message: 'A refund request for this transaction is already pending review.' });
    }

    await BillPayment.findByIdAndUpdate(payment._id, {
      refundStatus: 'pending',
      refundReason: req.body.reason || 'Admin initiated',
      refundAmount: payment.amount,
    });

    sendSuccess(res, {
      success: true,
      message: 'Refund request recorded — manual processing required',
      refundStatus: 'pending',
    });
  }),
);

export default router;
