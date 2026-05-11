// @ts-nocheck
import { Router } from 'express';
import {
  uploadBill,
  analyzeBillForUser,
  getUserBills,
  getBillById,
  getBillStatistics,
  resubmitBill,
  getPendingBills,
  approveBill,
  rejectBill,
  getVerificationStatistics,
  getUserFraudHistory,
} from '../controllers/billController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { uploadProfileImage as upload } from '../middleware/upload';
// LS-001 FIX: Import upload and OCR-specific rate limiters
import { uploadLimiter, createRateLimiter } from '../middleware/rateLimiter';

// LS-001 FIX: OCR analyze-image is expensive (Cloudinary + Google Vision per call).
// Without a limiter, 1000 concurrent requests each hit Cloudinary + external OCR API
// simultaneously, creating an unbounded external-API fan-out that will OOM the process
// and exhaust external API quotas.  Cap to 5 analyze calls per minute per user.
const ocrAnalyzeLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many OCR analyze requests. Please wait before trying again.',
  prefix: 'bill-ocr-analyze',
});

// LS-001 FIX: Bill upload (uploadLimiter) is 10/min per user — reasonable for
// normal use.  This prevents a single user flooding 1000 concurrent uploads which
// each individually invoke Cloudinary, fraud detection, and fire-and-forget OCR.
// The global generalLimiter (500/15min) still applies to all routes via routes.ts.

const router = Router();

// All routes require authentication
router.use(authenticate);

// User routes
// LS-001 FIX: uploadLimiter guards the expensive Cloudinary + fraud-detection path
router.post('/upload', uploadLimiter, upload.single('billImage'), uploadBill);
router.get('/', getUserBills);
router.get('/statistics', getBillStatistics);
// Bill image analysis (OCR — pre-fills amount/merchant before upload)
// LS-001 FIX: ocrAnalyzeLimiter caps the Cloudinary + Vision API fan-out
router.post('/analyze-image', ocrAnalyzeLimiter, upload.single('billImage'), analyzeBillForUser);

router.get('/:billId', getBillById);
router.post('/:billId/resubmit', upload.single('billImage'), resubmitBill);

// Admin routes — defence-in-depth: requireAdmin at routing layer + in-handler check
router.get('/admin/pending', requireAdmin, getPendingBills);
router.get('/admin/statistics', requireAdmin, getVerificationStatistics);
router.get('/admin/users/:userId/fraud-history', requireAdmin, getUserFraudHistory);
router.post('/:billId/approve', requireAdmin, approveBill);
router.post('/:billId/reject', requireAdmin, rejectBill);

export default router;
