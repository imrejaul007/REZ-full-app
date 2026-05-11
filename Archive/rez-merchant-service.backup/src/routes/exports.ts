// @ts-nocheck
import { Router, Request, Response } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { CoinTransaction } from '../models/CoinTransaction';
import { Payout } from '../models/Payout';
import { merchantAuth } from '../middleware/auth';
import { bulkGetUsers } from '../lib/authServiceClient';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// Helper: minimal CSV-safe field quoter (escapes double-quotes, wraps fields containing commas/newlines).
function csvCell(v: any): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function csvRow(cells: any[]): string {
  return cells.map(csvCell).join(',');
}

// Helper: parse optional from/to dates into a createdAt range.
function buildDateRange(from?: string, to?: string): any {
  const range: any = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) range.$gte = d;
  }
  if (to) {
    // End-of-day for inclusive "to" filter.
    const d = new Date(to);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      range.$lte = d;
    }
  }
  return Object.keys(range).length ? range : undefined;
}

// Helper: verify the merchant owns the given store.
async function verifyStoreOwnership(storeId: string, merchantId: string) {
  if (!mongoose.Types.ObjectId.isValid(storeId)) return null;
  return Store.findOne({ _id: storeId, merchantId: merchantId }).select('_id').lean();
}

router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { storeId, startDate, endDate, format = 'json' } = req.query as any;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    const ownedStore = await Store.findOne({ _id: storeId, merchantId: req.merchantId }).select('_id').lean();
    if (!ownedStore) { res.status(403).json({ success: false, message: 'Access denied: store not found or not yours' }); return; }
    const query: any = { store: new mongoose.Types.ObjectId(storeId) };
    if (startDate || endDate) { query.createdAt = {}; if (startDate) query.createdAt.$gte = new Date(startDate); if (endDate) query.createdAt.$lte = new Date(endDate); }
    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(5000).lean();
    if (format === 'csv') {
      const header = 'orderId,total,status,createdAt\n';
      const rows = orders.map((o: any) => `${o._id},${o.total || 0},${o.status},${o.createdAt}`).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
      res.send(header + rows); return;
    }
    res.json({ success: true, data: orders, count: orders.length });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.get('/products', async (req: Request, res: Response) => {
  try {
    const { storeId, format = 'json' } = req.query as any;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    const ownedStore = await Store.findOne({ _id: storeId, merchantId: req.merchantId }).select('_id').lean();
    if (!ownedStore) { res.status(403).json({ success: false, message: 'Access denied: store not found or not yours' }); return; }
    const products = await Product.find({ store: new mongoose.Types.ObjectId(storeId) }).lean();
    if (format === 'csv') {
      const header = 'productId,name,price,stock,isActive\n';
      const rows = products.map((p: any) => `${p._id},${p.name},${p.price || 0},${p.stock || 0},${p.isActive}`).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
      res.send(header + rows); return;
    }
    res.json({ success: true, data: products, count: products.length });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Merchant report exports (transactions, customers, payouts) used by the
// merchant app's /reports/export screen. Always returns CSV.
// ────────────────────────────────────────────────────────────────────────────

// Transactions export — one row per coin transaction for the merchant's store.
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { storeId, from, to } = req.query as any;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId required' });
      return;
    }
    const owned = await verifyStoreOwnership(storeId, req.merchantId!);
    if (!owned) {
      res.status(403).json({ success: false, message: 'Access denied: store not found or not yours' });
      return;
    }
    const storeObjId = new mongoose.Types.ObjectId(storeId);
    const query: any = {
      merchantId: req.merchantId,
      $or: [{ storeId: storeObjId }, { store: storeObjId }, { 'metadata.storeId': storeObjId }],
    };
    const dateRange = buildDateRange(from, to);
    if (dateRange) query.createdAt = dateRange;
    const txns = await CoinTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();
    const header = csvRow(['Date', 'TransactionId', 'UserId', 'Amount', 'Type', 'Source', 'Status']) + '\n';
    const rows = txns
      .map((t: any) =>
        csvRow([
          t.createdAt ? new Date(t.createdAt).toISOString() : '',
          t._id,
          t.userId || t.user || '',
          t.amount ?? 0,
          t.type || '',
          t.source || (t.metadata && t.metadata.source) || '',
          t.status || '',
        ])
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions.csv`);
    res.send(header + rows);
  } catch (e: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// Customers export — aggregated per-user spend across coin transactions.
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const { storeId, from, to } = req.query as any;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId required' });
      return;
    }
    const owned = await verifyStoreOwnership(storeId, req.merchantId!);
    if (!owned) {
      res.status(403).json({ success: false, message: 'Access denied: store not found or not yours' });
      return;
    }
    const storeObjId = new mongoose.Types.ObjectId(storeId);
    const match: any = {
      merchantId: req.merchantId,
      $or: [{ storeId: storeObjId }, { store: storeObjId }, { 'metadata.storeId': storeObjId }],
    };
    const dateRange = buildDateRange(from, to);
    if (dateRange) match.createdAt = dateRange;

    const agg = await CoinTransaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $ifNull: ['$userId', '$user'] },
          totalSpend: { $sum: { $ifNull: ['$amount', 0] } },
          visitCount: { $sum: 1 },
          lastVisit: { $max: '$createdAt' },
        },
      },
      { $sort: { totalSpend: -1 } },
      { $limit: 10000 },
    ]);

    const userIds = agg.map((a: any) => a._id).filter(Boolean);
    // P1-DATA-1 FIX: Replaced direct DB read of users collection (auth-service owned)
    // with internal HTTP call to rez-auth-service /internal/users/bulk.
    const userMap = userIds.length ? await bulkGetUsers(userIds) : new Map();

    const header = csvRow(['UserId', 'Name', 'Email', 'Phone', 'TotalSpend', 'VisitCount', 'LastVisit']) + '\n';
    const rows = agg
      .map((row: any) => {
        const u = userMap.get(String(row._id)) || {};
        return csvRow([
          row._id || '',
          u.name || '',
          u.email || '',
          u.phone || '',
          row.totalSpend ?? 0,
          row.visitCount ?? 0,
          row.lastVisit ? new Date(row.lastVisit).toISOString() : '',
        ]);
      })
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customers.csv`);
    res.send(header + rows);
  } catch (e: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// Payouts export — all payouts for the merchant, optionally date-filtered.
router.get('/payouts', async (req: Request, res: Response) => {
  try {
    const { storeId, from, to } = req.query as any;
    // Payouts are merchant-scoped; storeId is accepted for ownership verification parity
    // with the other export endpoints but is not strictly required for filtering.
    if (storeId) {
      const owned = await verifyStoreOwnership(storeId, req.merchantId!);
      if (!owned) {
        res.status(403).json({ success: false, message: 'Access denied: store not found or not yours' });
        return;
      }
    }
    const query: any = { merchantId: new mongoose.Types.ObjectId(req.merchantId!) };
    const dateRange = buildDateRange(from, to);
    if (dateRange) query.createdAt = dateRange;
    const payouts = await Payout.find(query).sort({ createdAt: -1 }).limit(10000).lean();
    const header = csvRow(['PayoutId', 'Date', 'Amount', 'Status', 'Method', 'Reference']) + '\n';
    const rows = payouts
      .map((p: any) =>
        csvRow([
          p._id,
          p.createdAt ? new Date(p.createdAt).toISOString() : '',
          p.amount ?? 0,
          p.status || '',
          p.method || p.paymentMethod || '',
          p.reference || p.transactionId || '',
        ])
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payouts.csv`);
    res.send(header + rows);
  } catch (e: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
