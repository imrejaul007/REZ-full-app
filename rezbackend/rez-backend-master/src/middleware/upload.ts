// Upload Middleware for Cloudinary
// Handles file uploads with multer and cloudinary

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
const cloudinary = require('cloudinary').v2;
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import { logger } from '../config/logger';

const SMALL_FILE_THRESHOLD = 5 * 1024 * 1024; // 5 MB — below this, CloudinaryStorage is used directly
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB hard cap to prevent OOM

// Temp directory for large-file disk buffering before streaming to Cloudinary
const LARGE_UPLOAD_TMP_DIR = process.env.UPLOAD_TMP_DIR || path.join(os.tmpdir(), 'rez-large-uploads');
if (!fs.existsSync(LARGE_UPLOAD_TMP_DIR)) {
  fs.mkdirSync(LARGE_UPLOAD_TMP_DIR, { recursive: true });
}

/**
 * Disk storage engine for large files (>5 MB).
 * Files are streamed to a temp directory first, then uploaded to Cloudinary
 * via a streaming pipeline, preventing the entire buffer from living in heap.
 */
const largeTmpDiskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LARGE_UPLOAD_TMP_DIR),
  filename: (_req, file, cb) => {
    const uid = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${uid}${ext}`);
  },
});

/**
 * Stream a locally-saved temp file to Cloudinary, then delete the temp file.
 * Returns the Cloudinary secure URL.
 */
async function streamTempFileToCloudinary(filePath: string, options: Record<string, any>): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error: any, result: any) => {
      // Always clean up the temp file regardless of outcome
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr && unlinkErr.code !== 'ENOENT') {
          logger.warn(`[Upload] Failed to delete temp file ${filePath}: ${unlinkErr.message}`);
        }
      });

      if (error) return reject(error);
      resolve(result.secure_url);
    });

    fs.createReadStream(filePath).pipe(uploadStream);
  });
}

/**
 * Build a middleware that handles the size-based split for a given Cloudinary folder/resource_type.
 *
 * Strategy:
 *   < 5 MB  → use the provided CloudinaryStorage instance (direct streaming, lowest latency)
 *   ≥ 5 MB  → use diskStorage to write to /tmp, then pipe to Cloudinary via upload_stream
 *
 * Both paths enforce a 50 MB hard cap.
 */
function buildHybridUploadMiddleware(
  cloudinaryStorageInstance: any,
  fileFilter: multer.Options['fileFilter'],
  cloudinaryOptions: (req: Request, file: Express.Multer.File) => Record<string, any>,
): (req: Request, res: Response, next: NextFunction) => void {
  const smallUploader = multer({
    storage: cloudinaryStorageInstance,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
  }).single('file');

  const largeUploader = multer({
    storage: largeTmpDiskStorage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
  }).single('file');

  return (req: Request, res: Response, next: NextFunction) => {
    // Peek at Content-Length to pick a storage strategy up-front.
    // If missing/ambiguous, default to disk (safer for unknown large payloads).
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const useDisk = isNaN(contentLength) || contentLength >= SMALL_FILE_THRESHOLD;

    if (!useDisk) {
      // Small file — let CloudinaryStorage handle it directly
      return smallUploader(req, res, next);
    }

    // Large file — write to disk first, then stream to Cloudinary
    largeUploader(req, res, async (err) => {
      if (err) return next(err);
      if (!req.file || !req.file.path) return next(); // no file uploaded

      try {
        const options = cloudinaryOptions(req, req.file);
        const secureUrl = await streamTempFileToCloudinary(req.file.path, options);

        // Patch req.file to look like a CloudinaryStorage result so downstream
        // controllers don't need to know about the two-phase upload path.
        (req.file as any).path = secureUrl;
        (req.file as any).secure_url = secureUrl;

        logger.info(`[Upload] Large file streamed to Cloudinary: ${secureUrl}`);
        next();
      } catch (uploadErr: any) {
        logger.error('[Upload] Failed to stream large file to Cloudinary:', uploadErr.message);
        next(uploadErr);
      }
    });
  };
}

// Allowed file extensions for security validation (checks actual extension, not just mimetype header)
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.heic', '.heif'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
const ALLOWED_DOC_EXTENSIONS = ['.pdf'];

function isAllowedImageFile(file: Express.Multer.File): boolean {
  const ext = path.extname(file.originalname).toLowerCase();
  return file.mimetype.startsWith('image/') && ALLOWED_IMAGE_EXTENSIONS.includes(ext);
}

function isAllowedVideoFile(file: Express.Multer.File): boolean {
  const ext = path.extname(file.originalname).toLowerCase();
  return file.mimetype.startsWith('video/') && ALLOWED_VIDEO_EXTENSIONS.includes(ext);
}

function isAllowedDocFile(file: Express.Multer.File): boolean {
  const ext = path.extname(file.originalname).toLowerCase();
  return file.mimetype === 'application/pdf' && ALLOWED_DOC_EXTENSIONS.includes(ext);
}

dotenv.config();

// Configure Cloudinary with increased timeout
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  timeout: 120000, // 120 seconds timeout (increased from 60)
});

logger.info('☁️  [CLOUDINARY] Configuration loaded:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key_present: !!process.env.CLOUDINARY_API_KEY,
  api_secret_present: !!process.env.CLOUDINARY_API_SECRET,
});

// Test Cloudinary connection at startup (skip if not configured)
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  logger.warn('⚠️ [CLOUDINARY] cloud_name not set — file uploads will be disabled');
} else {
  cloudinary.api
    .ping()
    .then(() => {
      logger.info('✅ [CLOUDINARY] Connection successful!');
    })
    .catch((error: any) => {
      const errMsg = error?.message || error?.error?.message || String(error);
      logger.error('❌ [CLOUDINARY] Connection failed:', errMsg);
      if (errMsg.includes('Invalid cloud_name')) {
        logger.error('   → Check CLOUDINARY_CLOUD_NAME in .env');
      } else if (errMsg.includes('quota')) {
        logger.error('   → Your Cloudinary storage quota may be full!');
        logger.error('   → Check: https://cloudinary.com/console/usage');
      }
    });
}

// Create storage engine for profile images - MINIMAL CONFIG FOR SPEED
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, _file) => {
    logger.info(`📤 [CLOUDINARY] Uploading avatar for user: ${req.user?._id}`);
    return {
      folder: 'rez-app/profiles',
      resource_type: 'image',
      public_id: `user_${req.user?._id}_${Date.now()}`,
      // No transformations during upload for maximum speed
      timeout: 120000,
    };
  },
});

// Create storage engine for project files (images/videos)
const projectStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    logger.info(`📤 [CLOUDINARY] Uploading project file for user: ${req.user?._id}`);
    const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    return {
      folder: 'rez-app/projects',
      resource_type: resourceType,
      public_id: `project_${req.user?._id}_${Date.now()}`,
      timeout: 120000,
    };
  },
});

// Create multer upload instance for profile images
export const uploadProfileImage = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!isAllowedImageFile(file)) {
      return cb(new Error('Only image files are allowed (jpg, png, webp, gif)!') as any, false);
    }
    cb(null, true);
  },
});

// Create storage engine for review images
const reviewStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, _file) => {
    logger.info(`📤 [CLOUDINARY] Uploading review image for user: ${req.user?._id}`);
    return {
      folder: 'rez-app/reviews',
      resource_type: 'image',
      public_id: `review_${req.user?._id}_${Date.now()}`,
      timeout: 120000,
    };
  },
});

// Create multer upload instance for project files (images/videos)
export const uploadProjectFile = multer({
  storage: projectStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!isAllowedImageFile(file) && !isAllowedVideoFile(file)) {
      return cb(new Error('Only image and video files are allowed!') as any, false);
    }
    cb(null, true);
  },
});

// Create storage engine for social media proof uploads (images/videos)
const socialMediaProofStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    logger.info(`📤 [CLOUDINARY] Uploading social media proof for user: ${req.user?._id}`);
    const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    return {
      folder: 'rez-app/social-media-proofs',
      resource_type: resourceType,
      public_id: `social_proof_${req.user?._id}_${Date.now()}`,
      timeout: 120000,
    };
  },
});

// Create multer upload instance for social media proof files (images/videos)
export const uploadSocialMediaProof = multer({
  storage: socialMediaProofStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!isAllowedImageFile(file) && !isAllowedVideoFile(file)) {
      return cb(new Error('Only image and video files are allowed!') as any, false);
    }
    cb(null, true);
  },
});

// Create multer upload instance for review images
export const uploadReviewImage = multer({
  storage: reviewStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for review images
  },
  fileFilter: (req, file, cb) => {
    if (!isAllowedImageFile(file)) {
      return cb(new Error('Only image files are allowed (jpg, png, webp, gif)!') as any, false);
    }
    cb(null, true);
  },
});

// Create storage engine for verification documents
const verificationStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, _file) => {
    const zone = req.params?.zone || 'general';
    logger.info(`📤 [CLOUDINARY] Uploading verification document for user: ${(req as any).user?._id} (zone: ${zone})`);
    return {
      folder: `rez-app/verifications/${zone}`,
      resource_type: 'image',
      public_id: `verification_${(req as any).user?._id}_${Date.now()}`,
      timeout: 120000,
    };
  },
});

// Create multer upload instance for verification documents
export const uploadVerificationDocument = multer({
  storage: verificationStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for verification documents
  },
  fileFilter: (req, file, cb) => {
    if (!isAllowedImageFile(file) && !isAllowedDocFile(file)) {
      return cb(new Error('Only image and PDF files are allowed for verification!') as any, false);
    }
    cb(null, true);
  },
});
