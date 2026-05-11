/**
 * Security Headers Configuration for REZ Loyalty System
 *
 * Configures Helmet.js and additional security headers to protect
 * against common web vulnerabilities.
 */
import { Request, Response, NextFunction } from 'express';
export interface SecurityHeadersConfig {
    contentSecurityPolicy: string;
    crossOriginEmbedderPolicy: string;
    crossOriginOpenerPolicy: string;
    crossOriginResourcePolicy: string;
    dnsPrefetchControl: {
        allow: boolean;
    };
    frameguard: {
        action: string;
        domain?: string;
    };
    hidePoweredBy: boolean;
    hsts: {
        maxAge: number;
        includeSubDomains: boolean;
        preload: boolean;
    };
    ieNoOpen: boolean;
    noSniff: boolean;
    originAgentCluster: boolean;
    permittedCrossDomainPolicies: {
        permittedPolicies: string;
    };
    referrerPolicy: {
        policy: string;
    };
    xssFilter: boolean;
}
/**
 * Get security headers configuration
 */
export declare function getSecurityHeadersConfig(): SecurityHeadersConfig;
/**
 * Express middleware to set security headers
 */
export declare function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Helmet configuration for TypeScript
 */
export declare function getHelmetConfig(): {
    contentSecurityPolicy: {
        directives: Record<string, string[]>;
    };
    crossOriginEmbedderPolicy: boolean;
    crossOriginOpenerPolicy: string;
    crossOriginResourcePolicy: string;
    dnsPrefetchControl: {
        allow: boolean;
    };
    frameguard: {
        action: string;
        domain?: string;
    };
    hidePoweredOn: boolean;
    hsts: {
        maxAge: number;
        includeSubDomains: boolean;
        preload: boolean;
    };
    ieNoOpen: boolean;
    noSniff: boolean;
    originAgentCluster: boolean;
    permittedCrossDomainPolicies: {
        permittedPolicies: string;
    };
    referrerPolicy: {
        policy: string;
    };
};
/**
 * Get default security headers object (for use without middleware)
 */
export declare function getDefaultSecurityHeaders(): Record<string, string>;
/**
 * Apply security headers to a response
 */
export declare function applySecurityHeaders(res: Response): void;
/**
 * Development security headers (less strict)
 */
export declare function getDevelopmentSecurityHeaders(): Record<string, string>;
/**
 * Get environment-appropriate security headers
 */
export declare function getEnvironmentSecurityHeaders(): Record<string, string>;
//# sourceMappingURL=helmet.d.ts.map