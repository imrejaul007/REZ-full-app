import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { logger } from '../config/logger';
import { Bill } from '../models/Bill';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendNotFound } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { billVerificationService } from '../services/billVerificationService';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUtils';
import { fraudDetectionService } from '../services/fraudDetectionService';
import * as crypto from 'crypto';
import gamificationEventBus from '../events/gamificationEventBus';
import redisService from '../services/redisService';
import { ocrService } from '../services/ocrService';
import pushNotificationService from '../services/pushNotificationService';
import SystemConfig from '../models/SystemConfig';

// LS-008 FIX: Unbounded fire-and-forget verification fan-out.
// billVerificationService.processBill() is called with .then().catch() (fire-and-forget)
// for every upload.  At 1000 concurrent uploads that's 1000 simultaneous OCR + fraud
// detection chains running in parallel, each doing multiple DB round-trips and external
// HTTP calls.  This exhausts the MongoDB connection pool and the process heap.
//
// Fix: Use a simple in-process semaphore to cap concurrent in-flight verifications.
// Jobs beyond the cap are queued in a lightweight Promise chain — they start as soon
// as a slot becomes free, providing natural backpressure without an external queue.
//
// Production note: Replace with a proper job queue (BullMQ, etc.) when throughput
// exceeds what this in-process semaphore can handle.  The semaphore is a fast fix
// that prevents OOM while the queue infrastructure is set up.
const MAX_CONCURRENT_VERIFICATIONS = parseInt(process.env.MAX_CONCURRENT_BILL_VERIFICATIONS || '20', 10);
let activeVerifications = 0;
const verificationQueue: Array<() => void> = [];

function runVerificationWithBackpressure(fn: () => Promise<void>): void {
  const run = () => {
    activeVerifications++;
    fn()
      .catch((err) => logger.error('[BillController] Queued verification error:', err))
      .finally(() => {
        activeVerifications--;
        if (verificationQueue.length > 0) {
          const next = verificationQueue.shift()!;
          next();
        }
      });
  };

  if (activeVerifications < MAX_CONCURRENT_VERIFICATIONS) {
    run();
  } else {
    verificationQueue.push(run);
    logger.debug(
      `[BillController] Verification queued (${verificationQueue.length} waiting, ${activeVerifications} active)`,
    );
  }
}

// Analyze bill image for user (OCR pre-fill before upload)
export const analyzeBillForUser = asyncHandler(async (req: Request, res: Response) => {
  if (!(req as any).user) throw new AppError('Authentication required', 401);
  if (!req.file) throw new AppError('Bill image is required', 400);

  try {
    // Upload to Cloudinary temporarily for OCR processing
    const uploadResult = await uploadToCloudinary(req.file.buffer, 'bills/temp');

    // Run OCR
    const ocrResult = await ocrService.extractTextFromBill(uploadResult.secureUrl);

    // Delete temp image (full upload happens on submit)
    deleteFromCloudinary(uploadResult.publicId).catch(() => {});

    if (ocrResult.success && ocrResult.extractedData) {
      const { amount, merchantName, date, billNumber } = ocrResult.extractedData;
      return sendSuccess(
        res,
        {
          amount: amount ?? null,
          merchantName: merchantName ?? null,
          date: date ? new Date(date).toISOString().split('T')[0] : null,
          billNumber: billNumber ?? null,
          confidence: ocrResult.confidence ?? 0,
        },
        'Bill analyzed',
      );
    }

    return sendSuccess(
      res,
      {
        amount: null,
        merchantName: null,
        date: null,
        billNumber: null,
        confidence: 0,
      },
      'Could not extract bill details — please enter manually',
    );
  } catch (err) {
    logger.warn('[BILL ANALYZE] OCR failed:', (err as Error).message);
    return sendSuccess(
      res,
      {
        amount: null,
        merchantName: null,
        date: null,
        billNumber: null,
        confidence: 0,
      },
      'Analysis unavailable — please enter manually',
    );
  }
});

// Upload bill with image
export const uploadBill = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  // Check if file is uploaded
  if (!req.file) {
    throw new AppError('Bill image is required', 400);
  }

  const { merchantId, amount, billDate, billNumber, notes } = req.body;

  // Validate required fields
  if (!merchantId || !amount || !billDate) {
    throw new AppError('Merchant, amount, and bill date are required', 400);
  }

  logger.info('📤 [BILL UPLOAD] Processing bill upload...');
  logger.info('User:', req.user._id);
  logger.info('Merchant:', merchantId);
  logger.info('Amount:', amount);

  try {
    // Generate image hash for duplicate detection
    const imageHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // LS-008 FIX: TOCTOU duplicate-image race.
    // Original: findOne (check) → Bill.create (write).  At 1000 concurrent uploads with
    // the same image, all 1000 pass the findOne check before any Bill.create completes,
    // resulting in up to 1000 duplicate Bill documents for the same image.
    //
    // Fix: Use a Redis distributed lock keyed by the image hash so only one request
    // proceeds through the check+create critical section at a time.  We use a short
    // TTL (30s) — long enough to cover the Cloudinary upload + Bill.create but short
    // enough that a crash doesn't block the hash permanently.
    // If Redis is unavailable the lock returns null and we fall through (the unique
    // index on billImage.imageHash in the Bill model is the last-resort guard).
    const dupeLockKey = `bill:upload:hash:${imageHash}`;
    const dupeLockToken = await redisService.acquireLock(dupeLockKey, 30).catch(() => null);

    try {
      // Check for duplicate image (inside the lock scope)
      const duplicateImage = await Bill.findOne({
        'billImage.imageHash': imageHash,
        verificationStatus: { $in: ['pending', 'processing', 'approved'] },
        isActive: true,
      }).lean();

      if (duplicateImage) {
        throw new AppError('This bill image has already been uploaded', 400);
      }

      // Upload to Cloudinary
      logger.info('☁️ [CLOUDINARY] Uploading bill image...');
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer, `bills/${req.user._id}`, {
        transformation: [{ width: 1200, crop: 'limit' }, { quality: 'auto' }],
        generateThumbnail: true,
      });

      logger.info('✅ [CLOUDINARY] Image uploaded successfully');

      // Create bill document
      const bill = await Bill.create({
        user: req.user._id,
        merchant: merchantId,
        billImage: {
          url: cloudinaryResult.url,
          thumbnailUrl: cloudinaryResult.thumbnailUrl,
          cloudinaryId: cloudinaryResult.publicId,
          publicId: cloudinaryResult.publicId,
          imageHash,
        },
        amount: parseFloat(amount),
        billDate: new Date(billDate),
        billNumber,
        notes,
        verificationStatus: 'pending',
        metadata: {
          ipAddress: req.ip,
          deviceInfo: req.headers['user-agent'],
        },
      });

      logger.info('✅ [BILL] Bill created:', bill._id);

      // LS-008 FIX: Replace unbounded fire-and-forget with backpressure semaphore.
      // This caps in-flight verification chains at MAX_CONCURRENT_VERIFICATIONS (default 20),
      // queuing the rest rather than launching them all simultaneously.
      const billId = bill._id as Types.ObjectId;
      const billUrl = cloudinaryResult.url;
      const uploadUserId = String(req.user._id);
      runVerificationWithBackpressure(async () => {
        const result = await billVerificationService.processBill(billId, billUrl, imageHash);
        logger.info(`✅ [VERIFICATION] Bill ${billId} processed:`, result.status);

        // Auto-approve if OCR confidence meets threshold and fraud score is low
        try {
          const verifiedBill = await Bill.findById(billId);
          if (
            verifiedBill &&
            verifiedBill.verificationStatus === 'pending' &&
            verifiedBill.metadata?.ocrConfidence !== undefined &&
            verifiedBill.metadata?.fraudScore !== undefined
          ) {
            const configDoc = await SystemConfig.findOne({ key: 'bill_auto_approve_confidence' });
            // metadata.ocrConfidence and fraudScore are stored on a 0-100 scale
            const threshold = configDoc?.value !== undefined ? Number(configDoc.value) : 90;
            const fraudThreshold = 20;

            if (verifiedBill.metadata.ocrConfidence >= threshold && verifiedBill.metadata.fraudScore < fraudThreshold) {
              verifiedBill.verificationStatus = 'approved';
              verifiedBill.autoApproved = true;
              verifiedBill.verificationMethod = 'automatic';
              verifiedBill.metadata.verifiedAt = new Date();
              await verifiedBill.save();
              logger.info(
                `[Bill] Auto-approved bill ${billId} (ocrConfidence=${verifiedBill.metadata.ocrConfidence}, fraudScore=${verifiedBill.metadata.fraudScore})`,
              );

              // Notify user of auto-approval
              try {
                await pushNotificationService.sendPushToUser(uploadUserId, {
                  title: 'Bill Approved!',
                  body: `Your bill has been approved. ${verifiedBill.cashbackAmount ? `\u20b9${verifiedBill.cashbackAmount} cashback has been credited to your wallet.` : 'Cashback will be credited shortly.'}`,
                  data: { type: 'bill_approved', billId: billId.toString() },
                });
              } catch (notifErr) {
                logger.error('[Bill] Failed to send auto-approval notification:', notifErr);
              }
            }
          }
        } catch (autoApproveErr) {
          logger.error('[Bill] Auto-approval check failed:', autoApproveErr);
        }
      });

      // Emit bill_uploaded event for mission progress tracking
      gamificationEventBus.emit('bill_uploaded', {
        userId: String(req.user._id),
        entityId: String(bill._id),
        entityType: 'bill',
        amount: parseFloat(amount),
        storeId: merchantId,
        source: { controller: 'billController', action: 'uploadBill' },
      });

      // Populate merchant details before sending response
      await bill.populate('merchant', 'name logo cashbackPercentage');

      // Invalidate user's bill list cache
      redisService
        .delPattern(`bills:user:${req.user!._id}:*`)
        .catch((err) => logger.warn('[Bill] Cache invalidation for user bills failed', { error: err.message }));

      sendSuccess(res, bill, 'Bill uploaded successfully and is being verified', 201);
    } finally {
      // LS-008 FIX: Always release the per-hash duplicate lock.
      if (dupeLockToken) {
        await redisService.releaseLock(dupeLockKey, dupeLockToken).catch(() => {});
      }
    }
  } catch (error) {
    logger.error('❌ [BILL UPLOAD] Error:', error);
    throw error;
  }
});

// Get user's bill history
export const getUserBills = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { status, merchantId, startDate, endDate, limit = 20, page = 1 } = req.query;

  // Build query
  const query: any = {
    user: req.user._id,
    isActive: true,
  };

  if (status) {
    query.verificationStatus = status;
  }

  if (merchantId) {
    query.merchant = merchantId;
  }

  if (startDate || endDate) {
    query.billDate = {};
    if (startDate) {
      query.billDate.$gte = new Date(startDate as string);
    }
    if (endDate) {
      query.billDate.$lte = new Date(endDate as string);
    }
  }

  // Pagination
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  // Check cache (60s TTL)
  const cacheKey = `bills:user:${req.user._id}:${status || 'all'}:${merchantId || ''}:${page}:${limit}`;
  const cached = await redisService.get<any>(cacheKey);
  if (cached) {
    return sendSuccess(res, cached);
  }

  // Get bills and total count in parallel
  const [bills, total] = await Promise.all([
    Bill.find(query)
      .populate('merchant', 'name logo cashbackPercentage')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip)
      .lean(),
    Bill.countDocuments(query),
  ]);

  const data = {
    bills,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  };

  redisService
    .set(cacheKey, data, 60)
    .catch((err) => logger.warn('[Bill] Cache set for bill list failed', { error: err.message }));

  sendSuccess(res, data);
});

// Get bill by ID
export const getBillById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { billId } = req.params;

  const bill = await Bill.findOne({
    _id: billId,
    user: req.user._id,
    isActive: true,
  })
    .populate('merchant', 'name logo cashbackPercentage')
    .lean();

  if (!bill) {
    return sendNotFound(res, 'Bill not found');
  }

  sendSuccess(res, bill);
});

// Get bill statistics
export const getBillStatistics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const stats = await (Bill as any).getUserStatistics(req.user._id);

  sendSuccess(res, stats);
});

// Resubmit rejected bill
export const resubmitBill = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { billId } = req.params;

  // Check if file is uploaded
  if (!req.file) {
    throw new AppError('New bill image is required', 400);
  }

  const bill = await Bill.findOne({
    _id: billId,
    user: req.user._id,
    isActive: true,
  }).lean();

  if (!bill) {
    return sendNotFound(res, 'Bill not found');
  }

  if (bill.verificationStatus !== 'rejected') {
    throw new AppError('Only rejected bills can be resubmitted', 400);
  }

  // Check resubmission limit (max 3 times)
  if ((bill.resubmissionCount || 0) >= 3) {
    throw new AppError('Maximum resubmission limit reached', 400);
  }

  try {
    // Delete old image from Cloudinary
    if (bill.billImage.cloudinaryId) {
      await deleteFromCloudinary(bill.billImage.cloudinaryId);
    }

    // Generate new image hash
    const imageHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // Upload new image
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, `bills/${req.user._id}`, {
      transformation: [{ width: 1200, crop: 'limit' }, { quality: 'auto' }],
      generateThumbnail: true,
    });

    // Reprocess bill
    const result = await billVerificationService.reprocessBill(
      bill._id as Types.ObjectId,
      cloudinaryResult.url,
      imageHash,
    );

    if (!result.success) {
      throw new AppError(result.error || 'Resubmission failed', 400);
    }

    // Get updated bill
    const updatedBill = await Bill.findById(billId).populate('merchant', 'name logo cashbackPercentage').lean();

    sendSuccess(res, updatedBill, 'Bill resubmitted successfully');
  } catch (error) {
    logger.error('❌ [RESUBMIT] Error:', error);
    throw error;
  }
});

// Admin: Get pending bills for manual review
export const getPendingBills = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  const { limit = 20, page = 1 } = req.query;

  const bills = await billVerificationService.getPendingReviewBills(
    parseInt(limit as string, 10),
    parseInt(page as string, 10),
  );

  const total = await Bill.countDocuments({
    verificationStatus: 'pending',
    verificationMethod: 'manual',
    isActive: true,
  });

  sendSuccess(res, {
    bills,
    pagination: {
      total,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      pages: Math.ceil(total / parseInt(limit as string, 10)),
    },
  });
});

// Admin: Manually approve bill
export const approveBill = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  const { billId } = req.params;
  const { notes } = req.body;

  const result = await billVerificationService.manuallyApproveBill(
    billId as any,
    req.user._id as Types.ObjectId,
    notes,
  );

  if (!result.success) {
    throw new AppError(result.error || 'Approval failed', 400);
  }

  const bill = await Bill.findById(billId).populate('merchant', 'name logo').lean();

  // Send push notification to user on admin approval
  if (bill) {
    try {
      await pushNotificationService.sendPushToUser(bill.user.toString(), {
        title: 'Bill Approved!',
        body:
          bill.cashbackAmount && bill.cashbackAmount > 0
            ? `Your bill has been approved. \u20b9${bill.cashbackAmount} cashback has been credited to your wallet.`
            : 'Your bill has been approved.',
        data: { type: 'bill_approved', billId: bill._id.toString() },
      });
    } catch (notifErr) {
      logger.error('[Bill] Failed to send approval notification:', notifErr);
    }
  }

  sendSuccess(res, bill, 'Bill approved successfully');
});

// Admin: Manually reject bill
export const rejectBill = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  const { billId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw new AppError('Rejection reason is required', 400);
  }

  const result = await billVerificationService.manuallyRejectBill(
    billId as any,
    req.user._id as Types.ObjectId,
    reason,
  );

  if (!result.success) {
    throw new AppError(result.error || 'Rejection failed', 400);
  }

  const bill = await Bill.findById(billId).populate('merchant', 'name logo').lean();

  sendSuccess(res, bill, 'Bill rejected successfully');
});

// Admin: Get verification statistics
export const getVerificationStatistics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  const stats = await billVerificationService.getVerificationStatistics();

  sendSuccess(res, stats);
});

// Admin: Get user's fraud history
export const getUserFraudHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  const { userId } = req.params;

  const history = await fraudDetectionService.getUserFraudHistory(userId as any);

  sendSuccess(res, history);
});
