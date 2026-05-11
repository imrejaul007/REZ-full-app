/**
 * Risk Routes — fraud detection, credit marketplace, merchant financing, ecosystem credit
 *
 * @openapi
 * @tags Risk
 * @component
 */

import { Router } from 'express';
import { riskEngine } from '../engines/riskEngine';
import { creditMarketplace } from '../services/marketplaceService';
import { merchantFinancing } from '../services/merchantFinancing';
import { ecosystemCredit } from '../services/ecosystemCredit';
import { err, ErrorCodes } from '../utils/response';

const router = Router();

// Risk Engine

/**
 * @route GET /api/finance/risk/fraud/:userId
 * @summary Detect fraud risk for user
 * @tags Risk
 * @param {string} userId.path.required - User ID to check
 * @response {object} 200 - Fraud detection result
 * @response {object} 500 - Server error
 */
router.get('/risk/fraud/:userId', async (req, res) => {
  try {
    const result = await riskEngine.detectFraud(req.params.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

/**
 * @route GET /api/finance/risk/default/:userId
 * @summary Predict default probability for user
 * @tags Risk
 * @param {string} userId.path.required - User ID to check
 * @response {object} 200 - Default prediction result
 * @response {object} 500 - Server error
 */
router.get('/risk/default/:userId', async (req, res) => {
  try {
    const result = await riskEngine.predictDefault(req.params.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

/**
 * @route GET /api/finance/risk/anomaly/:userId
 * @summary Detect anomalous behavior for user
 * @tags Risk
 * @param {string} userId.path.required - User ID to check
 * @response {object} 200 - Anomaly detection result
 * @response {object} 500 - Server error
 */
router.get('/risk/anomaly/:userId', async (req, res) => {
  try {
    const result = await riskEngine.detectAnomalies(req.params.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

// Credit Marketplace

/**
 * @route GET /api/finance/marketplace/compare/:userId
 * @summary Compare credit offers from multiple partners
 * @tags Risk
 * @param {string} userId.path.required - User ID
 * @response {object} 200 - Comparison of available offers
 * @response {object} 500 - Server error
 */
router.get('/marketplace/compare/:userId', async (req, res) => {
  try {
    const offers = await creditMarketplace.compareOffers(req.params.userId);
    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

/**
 * @route GET /api/finance/marketplace/best/:userId
 * @summary Get best credit offer recommendation
 * @tags Risk
 * @param {string} userId.path.required - User ID
 * @response {object} 200 - Best offer recommendation
 * @response {object} 500 - Server error
 */
router.get('/marketplace/best/:userId', async (req, res) => {
  try {
    const offer = await creditMarketplace.recommendBestOffer(req.params.userId);
    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

// Merchant Financing

/**
 * @route GET /api/finance/merchant/:merchantId/limit
 * @summary Calculate merchant credit limit
 * @tags Risk
 * @param {string} merchantId.path.required - Merchant ID
 * @response {object} 200 - Merchant credit limit
 * @response {object} 500 - Server error
 */
router.get('/merchant/:merchantId/limit', async (req, res) => {
  try {
    const limit = await merchantFinancing.calculateMerchantLimit(req.params.merchantId);
    res.json({ success: true, data: limit });
  } catch (error) {
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

/**
 * @route POST /api/finance/merchant/loan
 * @summary Apply for merchant financing loan
 * @tags Risk
 * @param {object} body.required - Loan application details
 * @response {object} 200 - Loan application result
 * @response {object} 400 - Invalid request
 * @response {object} 500 - Server error
 */
router.post('/merchant/loan', async (req, res) => {
  try {
    const loan = await merchantFinancing.applyForLoan(req.body);
    res.json({ success: true, data: loan });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// Ecosystem Credit

/**
 * @route GET /api/finance/ecosystem/benefits/:userId
 * @summary Get ecosystem credit benefits for user
 * @tags Risk
 * @param {string} userId.path.required - User ID
 * @response {object} 200 - Ecosystem benefits
 * @response {object} 500 - Server error
 */
router.get('/ecosystem/benefits/:userId', async (req, res) => {
  try {
    const benefits = await ecosystemCredit.getBenefits(req.params.userId);
    res.json({ success: true, data: benefits });
  } catch (error) {
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

export default router;
