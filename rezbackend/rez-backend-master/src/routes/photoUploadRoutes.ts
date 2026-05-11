// @ts-nocheck
import { Router } from 'express';
import {
  uploadPhotos,
  getMyUploads,
  getStorePhotos,
  moderatePhoto,
  getPendingPhotos,
} from '../controllers/photoUploadController';
import { authenticate as authenticateToken, requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// User endpoints (authenticated)
// NOTE: This endpoint receives Cloudinary URLs already uploaded by the client
// (no multer/req.file present). validateImageUpload is therefore not applicable
// here — it would reject every request with "No file uploaded".
// Upload security is enforced at the Cloudinary level via signed upload presets.
router.post('/upload', authenticateToken, uploadPhotos);
router.get('/my-uploads', authenticateToken, getMyUploads);

// Public endpoint
router.get('/store/:storeId', getStorePhotos);

// Admin endpoints (require admin role)
router.get('/pending', requireAuth, requireAdmin, getPendingPhotos);
router.patch('/:id/moderate', requireAuth, requireAdmin, moderatePhoto);

export default router;
