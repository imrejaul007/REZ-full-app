// @ts-nocheck
/**
 * Public FAQ Routes
 * Endpoints for customers to access FAQ content
 */

import express, { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  getFaqs,
  getFaq,
  getFaqCategories,
  getPopularFaqs,
  getHelpfulFaqs,
  incrementFaqView,
  markFaqAsHelpful,
  markFaqAsNotHelpful,
  searchFaqs,
} from '../controllers/faqController';

const router = express.Router();

/**
 * @route   GET /api/faqs
 * @desc    Get all active FAQs with optional filtering
 * @query   category - Filter by category
 * @query   tags - Comma-separated tags
 * @query   search - Full-text search
 * @query   limit - Max results (default: 50, max: 100)
 * @access  Public
 */
router.get('/', asyncHandler(getFaqs));

/**
 * @route   GET /api/faqs/categories
 * @desc    Get FAQ categories with item counts
 * @access  Public
 */
router.get('/categories', asyncHandler(getFaqCategories));

/**
 * @route   GET /api/faqs/popular
 * @desc    Get most viewed FAQs
 * @query   limit - Max results (default: 10, max: 50)
 * @access  Public
 */
router.get('/popular', asyncHandler(getPopularFaqs));

/**
 * @route   GET /api/faqs/helpful
 * @desc    Get most helpful FAQs
 * @query   limit - Max results (default: 10, max: 50)
 * @access  Public
 */
router.get('/helpful', asyncHandler(getHelpfulFaqs));

/**
 * @route   GET /api/faqs/:id
 * @desc    Get a single FAQ by ID
 * @access  Public
 */
router.get('/:id', asyncHandler(getFaq));

/**
 * @route   POST /api/faqs/:id/view
 * @desc    Increment view count for an FAQ
 * @access  Public
 */
router.post('/:id/view', asyncHandler(incrementFaqView));

/**
 * @route   POST /api/faqs/:id/helpful
 * @desc    Mark FAQ as helpful
 * @access  Public
 */
router.post('/:id/helpful', asyncHandler(markFaqAsHelpful));

/**
 * @route   POST /api/faqs/:id/not-helpful
 * @desc    Mark FAQ as not helpful
 * @access  Public
 */
router.post('/:id/not-helpful', asyncHandler(markFaqAsNotHelpful));

export default router;
