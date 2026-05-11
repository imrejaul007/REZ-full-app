"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationRouter = void 0;
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const schemaService_1 = require("../services/schemaService");
exports.validationRouter = (0, express_1.Router)();
// Default rate limiter for all validation routes
const globalRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many requests, please try again later'
    }
});
exports.validationRouter.use(globalRateLimiter);
// Schema definitions for different endpoints
const schemas = {
    // User registration schema
    register: {
        body: {
            email: {
                type: 'email',
                required: true,
                sanitize: true
            },
            username: {
                type: 'string',
                required: true,
                minLength: 3,
                maxLength: 30,
                pattern: /^[a-zA-Z0-9_]+$/,
                sanitize: true
            },
            password: {
                type: 'string',
                required: true,
                minLength: 8,
                maxLength: 128
            },
            firstName: {
                type: 'string',
                required: false,
                maxLength: 50,
                sanitize: true
            },
            lastName: {
                type: 'string',
                required: false,
                maxLength: 50,
                sanitize: true
            }
        }
    },
    // Login schema
    login: {
        body: {
            email: {
                type: 'email',
                required: true
            },
            password: {
                type: 'string',
                required: true
            }
        }
    },
    // Generic text input schema
    textInput: {
        body: {
            content: {
                type: 'string',
                required: true,
                maxLength: 10000,
                sanitize: true
            },
            title: {
                type: 'string',
                required: false,
                maxLength: 200,
                sanitize: true
            }
        }
    },
    // Search query schema
    search: {
        query: {
            q: {
                type: 'string',
                required: true,
                maxLength: 200,
                sanitize: true
            },
            page: {
                type: 'number',
                required: false,
                min: 1,
                max: 1000
            },
            limit: {
                type: 'number',
                required: false,
                min: 1,
                max: 100
            }
        }
    },
    // ID parameter schema
    idParam: {
        params: {
            id: {
                type: 'string',
                required: true,
                pattern: /^[0-9]+$/
            }
        }
    },
    // Comment schema
    comment: {
        body: {
            text: {
                type: 'string',
                required: true,
                minLength: 1,
                maxLength: 5000,
                sanitize: true
            },
            parentId: {
                type: 'string',
                required: false,
                pattern: /^[0-9]*$/
            }
        }
    },
    // Profile update schema
    profileUpdate: {
        body: {
            displayName: {
                type: 'string',
                required: false,
                maxLength: 100,
                sanitize: true
            },
            bio: {
                type: 'string',
                required: false,
                maxLength: 500,
                sanitize: true
            },
            website: {
                type: 'string',
                required: false,
                pattern: /^https?:\/\/.+/
            }
        }
    },
    // JSON data schema
    jsonData: {
        body: {
            data: {
                type: 'object',
                required: true
            },
            metadata: {
                type: 'object',
                required: false
            }
        }
    }
};
// Validation endpoint examples
exports.validationRouter.post('/validate/register', schemaService_1.validateApiKey, (0, schemaService_1.createEndpointRateLimiter)(10, '1m'), (req, res, next) => {
    (0, schemaService_1.validateRequest)(req, res, next, schemas.register);
});
exports.validationRouter.post('/validate/login', (0, schemaService_1.createEndpointRateLimiter)(20, '1m'), (req, res, next) => {
    (0, schemaService_1.validateRequest)(req, res, next, schemas.login);
});
exports.validationRouter.post('/validate/text', (0, schemaService_1.createEndpointRateLimiter)(50, '1m'), (req, res, next) => {
    (0, schemaService_1.validateRequest)(req, res, next, schemas.textInput);
});
exports.validationRouter.get('/validate/search', (0, schemaService_1.createEndpointRateLimiter)(100, '1m'), (req, res, next) => {
    (0, schemaService_1.validateRequest)(req, res, next, schemas.search);
});
exports.validationRouter.get('/validate/resource/:id', (0, schemaService_1.createEndpointRateLimiter)(200, '1m'), (req, res, next) => {
    (0, schemaService_1.validateRequest)(req, res, next, schemas.idParam);
});
exports.validationRouter.post('/validate/comment', (0, schemaService_1.createEndpointRateLimiter)(30, '1m'), (req, res, next) => {
    (0, schemaService_1.validateRequest)(req, res, next, schemas.comment);
});
exports.validationRouter.patch('/validate/profile', schemaService_1.validateApiKey, (0, schemaService_1.createEndpointRateLimiter)(20, '1m'), (req, res, next) => {
    (0, schemaService_1.validateRequest)(req, res, next, schemas.profileUpdate);
});
exports.validationRouter.post('/validate/json', (0, schemaService_1.createEndpointRateLimiter)(50, '1m'), (0, schemaService_1.RequestSizeLimit)(50000), (req, res, next) => {
    (0, schemaService_1.validateRequest)(req, res, next, schemas.jsonData);
});
// Batch validation endpoint
exports.validationRouter.post('/validate/batch', schemaService_1.validateApiKey, (0, schemaService_1.createEndpointRateLimiter)(5, '1m'), (req, res) => {
    const { items, schemaName } = req.body;
    if (!Array.isArray(items)) {
        res.status(400).json({
            success: false,
            error: 'Items must be an array'
        });
        return;
    }
    if (!schemaName || !schemas[schemaName]) {
        res.status(400).json({
            success: false,
            error: 'Invalid schema name'
        });
        return;
    }
    const schema = schemas[schemaName];
    const results = items.map((item, index) => {
        try {
            const sanitized = (0, schemaService_1.sanitizeInput)(item, schema);
            return { index, success: true, data: sanitized };
        }
        catch (error) {
            return {
                index,
                success: false,
                error: error instanceof Error ? error.message : 'Validation failed'
            };
        }
    });
    const allSuccessful = results.every(r => r.success);
    res.status(allSuccessful ? 200 : 207).json({
        success: allSuccessful,
        results,
        summary: {
            total: items.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        }
    });
});
// Sanitization only endpoint (for already-validated data)
exports.validationRouter.post('/sanitize', (req, res) => {
    const { data, schemaName } = req.body;
    if (!schemaName || !schemas[schemaName]) {
        res.status(400).json({
            success: false,
            error: 'Invalid schema name'
        });
        return;
    }
    try {
        const sanitized = (0, schemaService_1.sanitizeInput)(data, schemas[schemaName]);
        res.json({
            success: true,
            sanitized
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Sanitization failed'
        });
    }
});
// Schema info endpoint
exports.validationRouter.get('/schemas', (_req, res) => {
    const schemaInfo = Object.keys(schemas).map(name => ({
        name,
        fields: Object.keys(schemas[name]?.body || {}).concat(Object.keys(schemas[name]?.query || {}))
    }));
    res.json({
        success: true,
        schemas: schemaInfo
    });
});
//# sourceMappingURL=validation.js.map