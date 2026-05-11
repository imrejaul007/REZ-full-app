import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { FAQ } from '../models/FAQ';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('faq-controller');

/**
 * GET /api/v1/faqs?category=payments&tags=billing
 * Get active FAQs with optional filtering
 */
export const getFaqs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, tags, search, limit = '50' } = req.query;
    const filter: any = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (tags) {
      const tagArray = (tags as string).split(',').map((t) => t.trim().toLowerCase());
      filter.tags = { $in: tagArray };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const faqs = await FAQ.find(filter)
      .sort(search ? { score: { $meta: 'textScore' } } : { category: 1, order: 1 })
      .limit(limitNum)
      .lean();

    res.json({ success: true, data: faqs, count: faqs.length });
  } catch (error: any) {
    logger.error('getFaqs error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch FAQs' });
  }
};

/**
 * GET /api/v1/faqs/categories
 * Get FAQ categories with counts
 */
export const getFaqCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await (FAQ as any).getCategories();
    res.json({ success: true, data: categories });
  } catch (error: any) {
    logger.error('getFaqCategories error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

/**
 * GET /api/v1/faqs/popular
 * Get most popular FAQs by view count
 */
export const getPopularFaqs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const faqs = await (FAQ as any).getPopularFAQs(limitNum);
    res.json({ success: true, data: faqs, count: faqs.length });
  } catch (error: any) {
    logger.error('getPopularFaqs error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch popular FAQs' });
  }
};

/**
 * GET /api/v1/faqs/helpful
 * Get most helpful FAQs
 */
export const getHelpfulFaqs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const faqs = await (FAQ as any).getMostHelpfulFAQs(limitNum);
    res.json({ success: true, data: faqs, count: faqs.length });
  } catch (error: any) {
    logger.error('getHelpfulFaqs error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch helpful FAQs' });
  }
};

/**
 * POST /api/v1/faqs/:id/view
 * Increment view count for an FAQ
 */
export const incrementFaqView = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid FAQ ID' });
      return;
    }
    const faq = await FAQ.findById(req.params.id);
    if (!faq || !faq.isActive) {
      res.status(404).json({ success: false, message: 'FAQ not found' });
      return;
    }

    await (faq as any).incrementView();
    res.json({ success: true, message: 'View counted' });
  } catch (error: any) {
    logger.error('incrementFaqView error', error);
    res.status(500).json({ success: false, message: 'Failed to increment view' });
  }
};

/**
 * GET /api/v1/faqs/:id
 * Get a single FAQ by ID
 */
export const getFaq = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid FAQ ID' });
      return;
    }
    const faq = await FAQ.findById(req.params.id).populate('relatedQuestions', 'question category').lean();

    if (!faq || !faq.isActive) {
      res.status(404).json({ success: false, message: 'FAQ not found' });
      return;
    }

    res.json({ success: true, data: faq });
  } catch (error: any) {
    logger.error('getFaq error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch FAQ' });
  }
};

/**
 * POST /api/v1/faqs/:id/helpful
 * Mark an FAQ as helpful
 */
export const markFaqAsHelpful = async (req: Request, res: Response): Promise<void> => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      res.status(404).json({ success: false, message: 'FAQ not found' });
      return;
    }

    await (faq as any).markAsHelpful();
    res.json({ success: true, message: 'Marked as helpful' });
  } catch (error: any) {
    logger.error('markFaqAsHelpful error', error);
    res.status(500).json({ success: false, message: 'Failed to mark as helpful' });
  }
};

/**
 * POST /api/v1/faqs/:id/not-helpful
 * Mark an FAQ as not helpful
 */
export const markFaqAsNotHelpful = async (req: Request, res: Response): Promise<void> => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      res.status(404).json({ success: false, message: 'FAQ not found' });
      return;
    }

    await (faq as any).markAsNotHelpful();
    res.json({ success: true, message: 'Marked as not helpful' });
  } catch (error: any) {
    logger.error('markFaqAsNotHelpful error', error);
    res.status(500).json({ success: false, message: 'Failed to mark as not helpful' });
  }
};

// ============================================
// ADMIN ROUTES BELOW
// ============================================

/**
 * POST /api/admin/faqs
 * Create a new FAQ
 */
export const createFaq = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, answer, category } = req.body;
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      res.status(400).json({ success: false, message: 'FAQ question is required' });
      return;
    }
    if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
      res.status(400).json({ success: false, message: 'FAQ answer is required' });
      return;
    }
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      res.status(400).json({ success: false, message: 'FAQ category is required' });
      return;
    }
    if (question.trim().length > 500) {
      res.status(400).json({ success: false, message: 'FAQ question must not exceed 500 characters' });
      return;
    }
    const faq = await FAQ.create({
      ...req.body,
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim(),
      createdBy: (req as any).user?._id,
      lastUpdatedBy: (req as any).user?._id,
    });
    logger.info('FAQ created', { id: faq._id });
    res.status(201).json({ success: true, data: faq });
  } catch (error: any) {
    logger.error('createFaq error', error);
    res.status(500).json({ success: false, message: 'Failed to create FAQ' });
  }
};

/**
 * PUT /api/admin/faqs/:id
 * Update an FAQ
 */
export const updateFaq = async (req: Request, res: Response): Promise<void> => {
  try {
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        lastUpdatedBy: (req as any).user?._id,
      },
      { new: true, runValidators: true },
    );

    if (!faq) {
      res.status(404).json({ success: false, message: 'FAQ not found' });
      return;
    }

    logger.info('FAQ updated', { id: faq._id });
    res.json({ success: true, data: faq });
  } catch (error: any) {
    logger.error('updateFaq error', error);
    res.status(500).json({ success: false, message: 'Failed to update FAQ' });
  }
};

/**
 * DELETE /api/admin/faqs/:id
 * Soft delete an FAQ
 */
export const deleteFaq = async (req: Request, res: Response): Promise<void> => {
  try {
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
        lastUpdatedBy: (req as any).user?._id,
      },
      { new: true },
    );

    if (!faq) {
      res.status(404).json({ success: false, message: 'FAQ not found' });
      return;
    }

    logger.info('FAQ soft-deleted', { id: req.params.id });
    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error: any) {
    logger.error('deleteFaq error', error);
    res.status(500).json({ success: false, message: 'Failed to delete FAQ' });
  }
};

/**
 * POST /api/admin/faqs/search
 * Search FAQs by text
 */
export const searchFaqs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, limit = '10' } = req.body;

    if (!q) {
      res.status(400).json({ success: false, message: 'Search query required' });
      return;
    }

    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const results = await (FAQ as any).searchFAQs(q, limitNum);

    res.json({ success: true, data: results, count: results.length });
  } catch (error: any) {
    logger.error('searchFaqs error', error);
    res.status(500).json({ success: false, message: 'Failed to search FAQs' });
  }
};

/**
 * POST /api/admin/faqs/bulk
 * Create multiple FAQs in bulk
 */
export const bulkCreateFaqs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { faqs } = req.body;

    if (!Array.isArray(faqs) || faqs.length === 0) {
      res.status(400).json({ success: false, message: 'FAQs array required and must not be empty' });
      return;
    }

    if (faqs.length > 100) {
      res.status(400).json({ success: false, message: 'Cannot bulk create more than 100 FAQs at once' });
      return;
    }

    const faqsWithMetadata = faqs.map((faq) => ({
      ...faq,
      createdBy: (req as any).user?._id,
      lastUpdatedBy: (req as any).user?._id,
    }));

    const created = await FAQ.insertMany(faqsWithMetadata, { ordered: false });

    logger.info('Bulk FAQ creation completed', { count: created.length });
    res.status(201).json({
      success: true,
      data: created,
      count: created.length,
      message: `Successfully created ${created.length} FAQs`,
    });
  } catch (error: any) {
    logger.error('bulkCreateFaqs error', error);
    res.status(500).json({ success: false, message: 'Failed to bulk create FAQs' });
  }
};

/**
 * GET /api/v1/faqs/:id
 * Alias for getFaq - for backward compatibility and route flexibility
 */
export const getFaqById = getFaq;
