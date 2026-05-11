// @ts-nocheck
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate, validateQuery, Joi } from '../middleware/validation';
import {
  getCampaigns,
  getCampaign,
  submitPost,
  getMySubmissions,
  getCampaignResults,
  deleteSubmission,
} from '../controllers/priveCampaignController';

const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────

const campaignQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  type: Joi.string().optional(),
  featured: Joi.string().valid('true', 'false').optional(),
});

const submitPostSchema = Joi.object({
  caption: Joi.string().max(2000).required(),
  mediaUrl: Joi.string().uri().required(),
  mediaType: Joi.string().valid('image', 'video').required(),
  mediaMetadata: Joi.object({
    width: Joi.number().optional(),
    height: Joi.number().optional(),
    duration: Joi.number().optional(),
    fileSize: Joi.number().required(),
    mimeType: Joi.string().required(),
  }).optional(),
});

// ─── Public routes ─────────────────────────────────────────────────────────

router.get('/', validateQuery(campaignQuerySchema), getCampaigns);
router.get('/:campaignId', getCampaign);
router.get('/:campaignId/results', getCampaignResults);

// ─── Authenticated routes ──────────────────────────────────────────────────

router.use(authenticate);

router.post('/:campaignId/submit', validate(submitPostSchema), submitPost);
router.get('/:campaignId/submissions', getMySubmissions);
router.delete('/:campaignId/submissions/:submissionId', deleteSubmission);

export default router;
