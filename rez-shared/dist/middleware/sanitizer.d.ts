/**
 * Input Sanitization Middleware
 *
 * Sanitizes text inputs to prevent XSS attacks.
 * Usage: app.use(sanitizeInputs);
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to sanitize request body, query, and params
 */
export declare function sanitizeInputs(req: Request, res: Response, next: NextFunction): void;
/**
 * Validate and sanitize a single string
 */
export declare function sanitizeString(value: string, maxLength?: number): string;
/**
 * Validate phone number format
 */
export declare function validatePhone(phone: string): boolean;
/**
 * Validate pincode format (India)
 */
export declare function validatePincode(pincode: string): boolean;
/**
 * Validate email format
 */
export declare function validateEmail(email: string): boolean;
/**
 * Sanitize and validate delivery address
 * Handles string fields and numeric coordinates without stringification
 */
export declare function sanitizeAddress(address: any): any;
