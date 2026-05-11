// @ts-nocheck
import { Router } from 'express';
import {
  createServiceAppointment,
  getUserServiceAppointments,
  getServiceAppointment,
  getStoreServiceAppointments,
  cancelServiceAppointment,
  checkAvailability,
  getAvailableSlots,
  updateServiceAppointmentStatus,
  markNoShow,
  addTreatmentNotes,
  updateAppointment,
  createRecurringSeries,
  updateSeriesFromHere,
} from '../controllers/serviceAppointmentController';
import { authenticate } from '../middleware/auth';
import { validateQuery, validateParams, validate, commonSchemas } from '../middleware/validation';
import { Joi } from '../middleware/validation';

const router = Router();

// ==================== APPOINTMENT ROUTES ====================

// Create service appointment (protected)
router.post(
  '/',
  authenticate,
  validate(
    Joi.object({
      storeId: commonSchemas.objectId().required(),
      serviceType: Joi.string().trim().min(2).max(200).required(),
      appointmentDate: Joi.date().iso().required(),
      appointmentTime: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
          'string.pattern.base': 'Time must be in HH:MM format (e.g., 14:30)',
        }),
      duration: Joi.number().integer().min(15).max(480).default(60),
      customerName: Joi.string().trim().min(2).max(100).required(),
      customerPhone: Joi.string().trim().min(7).max(20).required(),
      customerEmail: Joi.string().trim().email().optional(),
      specialInstructions: Joi.string().trim().max(1000).optional(),
      staffMember: Joi.string().trim().max(100).optional(),
      staffId: Joi.string().trim().optional(),
      staffName: Joi.string().trim().max(100).optional(),
      price: Joi.number().min(0).optional(),
      staffPriceOverride: Joi.boolean().optional(),
      bufferTimeAfter: Joi.number().integer().min(0).max(120).optional(),
    }),
  ),
  createServiceAppointment,
);

// Create recurring series (protected)
// MUST be before /:id dynamic segment
router.post(
  '/recurring',
  authenticate,
  validate(
    Joi.object({
      storeId: commonSchemas.objectId().required(),
      serviceType: Joi.string().trim().min(2).max(200).required(),
      appointmentDate: Joi.date().iso().required(),
      appointmentTime: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({ 'string.pattern.base': 'Time must be in HH:MM format (e.g., 14:30)' }),
      duration: Joi.number().integer().min(15).max(480).default(60),
      customerName: Joi.string().trim().min(2).max(100).required(),
      customerPhone: Joi.string().trim().min(7).max(20).required(),
      customerEmail: Joi.string().trim().email().optional(),
      specialInstructions: Joi.string().trim().max(1000).optional(),
      staffMember: Joi.string().trim().max(100).optional(),
      staffId: Joi.string().trim().optional(),
      staffName: Joi.string().trim().max(100).optional(),
      price: Joi.number().min(0).optional(),
      staffPriceOverride: Joi.boolean().optional(),
      bufferTimeAfter: Joi.number().integer().min(0).max(120).optional(),
      recurrence: Joi.object({
        frequency: Joi.string().valid('daily', 'weekly', 'biweekly', 'monthly').required(),
        interval: Joi.number().integer().min(1).max(52).default(1),
        daysOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
        endType: Joi.string().valid('never', 'after', 'on_date').default('never'),
        occurrences: Joi.number().integer().min(1).max(52).optional(),
        endDate: Joi.date().iso().optional(),
      }).required(),
    }),
  ),
  createRecurringSeries,
);

// Get user's appointments (protected)
router.get(
  '/user',
  authenticate,
  validateQuery(
    Joi.object({
      status: Joi.string().valid('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show').optional(),
    }),
  ),
  getUserServiceAppointments,
);

// Get store's appointments (protected)
// MUST be before /:appointmentId to avoid shadowing
router.get(
  '/store/:storeId',
  authenticate,
  validateParams(
    Joi.object({
      storeId: commonSchemas.objectId().required(),
    }),
  ),
  validateQuery(
    Joi.object({
      date: Joi.date().iso().optional(),
      status: Joi.string().valid('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show').optional(),
    }),
  ),
  getStoreServiceAppointments,
);

// Check availability for a time slot (public)
// MUST be before /:appointmentId — "availability" fails ObjectId validation causing 400 instead of routing here
router.get(
  '/availability/:storeId',
  validateParams(
    Joi.object({
      storeId: commonSchemas.objectId().required(),
    }),
  ),
  validateQuery(
    Joi.object({
      date: Joi.date().iso().required(),
      time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional()
        .messages({
          'string.pattern.base': 'Time must be in HH:MM format (e.g., 14:30)',
        }),
      duration: Joi.number().integer().min(15).max(480).default(60),
    }),
  ),
  checkAvailability,
);

// Get available time slots for a date (public)
// MUST be before /:appointmentId — same shadowing issue as /availability
router.get(
  '/slots/:storeId',
  validateParams(
    Joi.object({
      storeId: commonSchemas.objectId().required(),
    }),
  ),
  validateQuery(
    Joi.object({
      date: Joi.date().iso().required(),
      duration: Joi.number().integer().min(15).max(480).default(60),
    }),
  ),
  getAvailableSlots,
);

// Get appointment by ID (protected)
// Dynamic segment /:appointmentId must come AFTER all static-prefix routes
router.get(
  '/:appointmentId',
  authenticate,
  validateParams(
    Joi.object({
      appointmentId: commonSchemas.objectId().required(),
    }),
  ),
  getServiceAppointment,
);

// Cancel appointment (protected)
router.put(
  '/:appointmentId/cancel',
  authenticate,
  validateParams(
    Joi.object({
      appointmentId: commonSchemas.objectId().required(),
    }),
  ),
  validate(
    Joi.object({
      reason: Joi.string().trim().max(500).optional(),
    }),
  ),
  cancelServiceAppointment,
);

// Update appointment status (protected)
router.put(
  '/:id/status',
  authenticate,
  validate(
    Joi.object({
      status: Joi.string().valid('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show').required(),
      tip: Joi.number().min(0).optional(),
      tipPaymentId: Joi.string().trim().optional(),
    }),
  ),
  updateServiceAppointmentStatus,
);

// Mark appointment as no-show (protected — merchant/admin)
router.put(
  '/:id/no-show',
  authenticate,
  validateParams(
    Joi.object({
      id: commonSchemas.objectId().required(),
    }),
  ),
  validate(
    Joi.object({
      reason: Joi.string().trim().max(500).optional(),
    }),
  ),
  markNoShow,
);

// Add treatment notes to an appointment (protected — merchant)
router.put(
  '/:id/treatment-notes',
  authenticate,
  validateParams(
    Joi.object({
      id: commonSchemas.objectId().required(),
    }),
  ),
  validate(
    Joi.object({
      stylistNotes: Joi.string().trim().max(2000).optional(),
      clientVisibleNotes: Joi.string().trim().max(1000).optional(),
      colourFormula: Joi.string().trim().max(500).optional(),
      productsUsed: Joi.array().items(Joi.string().trim().max(200)).max(20).optional(),
      resultRating: Joi.number().integer().min(1).max(5).optional(),
      photosBefore: Joi.string().uri().optional(),
      photosAfter: Joi.string().uri().optional(),
    }),
  ),
  addTreatmentNotes,
);

// Update series from a given appointment (protected)
// MUST be before /:id to avoid being shadowed
router.put(
  '/:id/series',
  authenticate,
  validateParams(
    Joi.object({
      id: commonSchemas.objectId().required(),
    }),
  ),
  validate(
    Joi.object({
      updateScope: Joi.string().valid('this', 'this_and_following', 'all').required(),
      appointmentDate: Joi.date().iso().optional(),
      appointmentTime: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional(),
      duration: Joi.number().integer().min(15).max(480).optional(),
      staffId: commonSchemas.objectId().optional(),
      staffName: Joi.string().trim().max(100).optional(),
      specialInstructions: Joi.string().trim().max(1000).optional(),
    }),
  ),
  updateSeriesFromHere,
);

// Update appointment details (reschedule / reassign staff) — protected
router.put(
  '/:id',
  authenticate,
  validateParams(
    Joi.object({
      id: commonSchemas.objectId().required(),
    }),
  ),
  validate(
    Joi.object({
      appointmentDate: Joi.date().iso().optional(),
      appointmentTime: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional(),
      duration: Joi.number().integer().min(15).max(480).optional(),
      staffId: commonSchemas.objectId().optional(),
      staffName: Joi.string().trim().max(100).optional(),
      specialInstructions: Joi.string().trim().max(1000).optional(),
    }),
  ),
  updateAppointment,
);

export default router;
