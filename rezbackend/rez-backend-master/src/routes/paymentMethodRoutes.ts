// @ts-nocheck
import { Router } from 'express';
import {
  getUserPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from '../controllers/paymentMethodController';
import { authenticate } from '../middleware/auth';
import { validateParams, commonSchemas, Joi } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Reusable ObjectId param validator for /:id routes
const validateIdParam = validateParams(Joi.object({ id: commonSchemas.objectId().required() }));

// Payment method CRUD routes
router.get('/', getUserPaymentMethods);
router.get('/:id', validateIdParam, getPaymentMethodById);
router.post('/', createPaymentMethod);
router.put('/:id', validateIdParam, updatePaymentMethod);
router.delete('/:id', validateIdParam, deletePaymentMethod);
router.patch('/:id/default', validateIdParam, setDefaultPaymentMethod);

export default router;
