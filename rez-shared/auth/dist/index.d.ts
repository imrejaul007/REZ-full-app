import { AxiosInstance } from 'axios';
export declare const AUTH_HEADER = "Authorization";
export declare const REFRESH_TOKEN_KEY = "refresh_token";
export declare const ACCESS_TOKEN_KEY = "access_token";
export interface Tokens {
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
}
export interface SecureStore {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
}
/**
 * BrowserSecureStore — cookie-backed token storage for web platforms.
 *
 * SECURITY NOTE: Tokens stored here are accessible to JavaScript (not httpOnly),
 * so the primary defense against XSS is CSP, input sanitization, and avoiding
 * dangerous APIs (eval, innerHTML with user input). For defense-in-depth, the
 * server should ALSO set tokens as httpOnly cookies via Set-Cookie headers so
 * that even a successful XSS cannot exfiltrate them via document.cookie.
 *
 * Cookie flags applied: Secure (HTTPS only), SameSite=Strict, Path=/
 *
 * @deprecated Use CookieSecureStore directly for new code.
 *             This class is kept for backward compatibility but now delegates
 *             to cookie-based storage with the same security properties.
 */
export declare class BrowserSecureStore implements SecureStore {
    private readonly cookieStore;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
    /**
     * Sets a cookie with explicit flags.
     * Prefer having the server set tokens via Set-Cookie headers with httpOnly.
     * This method is provided for cases where client-side cookie setting is needed.
     */
    setCookie(key: string, value: string, options?: {
        secure?: boolean;
        sameSite?: 'Strict' | 'Lax' | 'None';
    }): Promise<void>;
    /**
     * Reads a cookie by name. Returns null if not found.
     */
    getCookie(key: string): Promise<string | null>;
}
export declare class CookieSecureStore implements SecureStore {
    private secure;
    private sameSite;
    constructor(secure?: boolean, sameSite?: string);
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
}
export declare class TokenManager {
    private store;
    private apiClient;
    constructor(store: SecureStore, apiClient: AxiosInstance);
    getAccessToken(): Promise<string | null>;
    setTokens(tokens: Tokens): Promise<void>;
    refreshAccessToken(refreshUrl: string): Promise<string>;
    logout(): Promise<void>;
    private setupInterceptor;
}
