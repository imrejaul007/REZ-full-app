// @ts-nocheck
import { Router } from 'express';
import {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/addressController';
import { authenticate } from '../middleware/auth';
import { validate, validateParams, commonSchemas } from '../middleware/validation';
import { Joi } from '../middleware/validation';

const router = Router();

// Shared param schema for address :id
const addressIdSchema = Joi.object({ id: commonSchemas.objectId().required() });

// Shared body schemas
const addressBodySchema = Joi.object({
  type: Joi.string().valid('home', 'work', 'other').required(),
  title: Joi.string().trim().max(100).optional(),
  phone: Joi.string().trim().max(20).optional(),
  addressLine1: Joi.string().trim().max(200).required(),
  addressLine2: Joi.string().trim().max(200).optional().allow(''),
  city: Joi.string().trim().max(100).required(),
  state: Joi.string().trim().max(100).required(),
  postalCode: Joi.string().trim().max(20).required(),
  country: Joi.string().trim().max(100).required(),
  coordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }).optional(),
  isDefault: Joi.boolean().optional(),
  instructions: Joi.string().trim().max(500).optional().allow(''),
});

// All update fields optional
const addressUpdateBodySchema = addressBodySchema.fork(
  ['type', 'addressLine1', 'city', 'state', 'postalCode', 'country'],
  (field) => field.optional(),
);

// All routes require authentication
router.use(authenticate);

// Address CRUD routes
router.get('/', getUserAddresses);
router.get('/:id', validateParams(addressIdSchema), getAddressById);
router.post('/', validate(addressBodySchema), createAddress);
router.put('/:id', validateParams(addressIdSchema), validate(addressUpdateBodySchema), updateAddress);
router.delete('/:id', validateParams(addressIdSchema), deleteAddress);
router.patch('/:id/default', validateParams(addressIdSchema), setDefaultAddress);

export default router;
