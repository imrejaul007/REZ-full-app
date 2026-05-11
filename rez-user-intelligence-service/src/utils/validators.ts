import Joi from 'joi';
import { EventType, DeviceType, CuisineType, PaymentMethod } from '../models/UserProfile';

// Event capture schema
export const eventSchema = Joi.object({
  eventType: Joi.string()
    .valid(...Object.values(EventType))
    .required()
    .messages({
      'any.required': 'Event type is required',
      'any.only': 'Invalid event type',
    }),

  userId: Joi.string().required().messages({
    'any.required': 'User ID is required',
  }),

  payload: Joi.object().required().messages({
    'any.required': 'Event payload is required',
  }),

  source: Joi.string().required().messages({
    'any.required': 'Event source is required',
  }),

  timestamp: Joi.date().iso().optional(),

  sessionId: Joi.string().optional(),

  deviceType: Joi.string()
    .valid(...Object.values(DeviceType))
    .optional(),
});

// Feedback submission schema
export const feedbackSchema = Joi.object({
  type: Joi.string()
    .valid('rating', 'review', 'complaint', 'suggestion')
    .required()
    .messages({
      'any.required': 'Feedback type is required',
    }),

  targetType: Joi.string()
    .valid('order', 'restaurant', 'item', 'delivery', 'app')
    .required()
    .messages({
      'any.required': 'Target type is required',
    }),

  targetId: Joi.string().required().messages({
    'any.required': 'Target ID is required',
  }),

  rating: Joi.number().min(1).max(5).optional(),

  title: Joi.string().max(200).optional(),

  comment: Joi.string().max(5000).optional(),

  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),

  images: Joi.array().items(Joi.string().uri()).max(5).optional(),

  isPublic: Joi.boolean().default(false),
}).or('rating', 'comment').messages({
  'object.missing': 'Either rating or comment is required for feedback',
});

// Push token schema
export const pushTokenSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Push token is required',
  }),

  platform: Joi.string()
    .valid('ios', 'android', 'web')
    .required()
    .messages({
      'any.required': 'Platform is required',
    }),

  deviceId: Joi.string().optional(),

  deviceName: Joi.string().optional(),
});

// User profile update schema
export const profileUpdateSchema = Joi.object({
  email: Joi.string().email().optional(),

  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid phone number format',
    }),

  displayName: Joi.string().min(1).max(100).optional(),

  avatarUrl: Joi.string().uri().optional(),

  preferences: Joi.object({
    cuisinePreferences: Joi.array()
      .items(
        Joi.object({
          cuisine: Joi.string()
            .valid(...Object.values(CuisineType))
            .required(),
          score: Joi.number().min(0).max(100).optional(),
        })
      )
      .optional(),

    priceRange: Joi.object({
      min: Joi.number().min(0).optional(),
      max: Joi.number().min(0).optional(),
      preferred: Joi.number().min(0).optional(),
    }).optional(),

    dietaryRestrictions: Joi.array().items(Joi.string()).optional(),

    allergenAvoidances: Joi.array().items(Joi.string()).optional(),

    deliveryPreferences: Joi.object({
      leaveAtDoor: Joi.boolean().optional(),
      contactlessDelivery: Joi.boolean().optional(),
      ringBell: Joi.boolean().optional(),
      gateCode: Joi.string().allow('', null).optional(),
      deliveryInstructions: Joi.string().max(500).optional(),
    }).optional(),

    notificationPreferences: Joi.object({
      orderUpdates: Joi.boolean().optional(),
      promotions: Joi.boolean().optional(),
      recommendations: Joi.boolean().optional(),
      newsletters: Joi.boolean().optional(),
      channels: Joi.array()
        .items(Joi.string().valid('push', 'email', 'sms'))
        .optional(),
    }).optional(),
  }).optional(),
});

// Life event schema
export const lifeEventSchema = Joi.object({
  type: Joi.string()
    .valid('birthday', 'anniversary', 'work_schedule_change', 'location_change', 'lifestyle_change')
    .required()
    .messages({
      'any.required': 'Event type is required',
    }),

  eventDate: Joi.date().iso().optional(),

  description: Joi.string().max(500).optional(),

  detectedFrom: Joi.string().valid('explicit', 'inferred').default('explicit'),
});

// Batch push token update schema
export const batchPushTokenSchema = Joi.object({
  updates: Joi.array()
    .items(
      Joi.object({
        userId: Joi.string().required(),
        token: Joi.string().required(),
        action: Joi.string().valid('add', 'remove', 'invalidate').required(),
      })
    )
    .min(1)
    .max(100)
    .required(),
});

// Query parameters schemas
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const recommendationQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10),
  types: Joi.array()
    .items(Joi.string().valid('restaurant', 'item', 'cuisine', 'promotion'))
    .optional(),
});

// Validation helper function
export const validate = <T>(schema: Joi.ObjectSchema, data: unknown): { value: T; error?: string } => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details.map((d) => d.message).join('; ');
    return { value: null as unknown as T, error: errorMessage };
  }

  return { value: value as T };
};

export default {
  eventSchema,
  feedbackSchema,
  pushTokenSchema,
  profileUpdateSchema,
  lifeEventSchema,
  batchPushTokenSchema,
  paginationSchema,
  recommendationQuerySchema,
  validate,
};
