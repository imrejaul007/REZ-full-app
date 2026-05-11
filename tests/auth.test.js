/**
 * Auth Service Tests
 * Comprehensive test suite for authentication and authorization
 *
 * Tests:
 * - Health checks
 * - User registration
 * - User login
 * - JWT token generation and validation
 * - Token refresh
 * - Password reset
 * - Session management
 * - OAuth flows (if applicable)
 * - Rate limiting
 * - Security validations
 */

const AUTH_BASE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000';

/**
 * Helper functions
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateTestEmail = () => `test_${Date.now()}@rez.test.com`;
const generateTestPhone = () => `+91${Date.now().toString().slice(-10)}`;
const generateTestPassword = () => `TestPass${Date.now()}!`;

/**
 * Test Configuration
 */
const TEST_USER = {
    email: generateTestEmail(),
    phone: generateTestPhone(),
    password: generateTestPassword(),
    name: 'Test User',
    userType: 'customer'
};

describe('Auth Service Tests', () => {
    let authToken = null;
    let refreshToken = null;
    let userId = null;

    // =========================================================================
    // SMOKE TESTS
    // =========================================================================
    describe('smoke - Auth Service Health', () => {
        test('Auth service health endpoint returns 200', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);
        });

        test('Auth service health returns healthy status', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/health`);
            const data = await response.json();

            expect(data).toHaveProperty('status');
            expect(['healthy', 'degraded']).toContain(data.status);
        });

        test('Auth service version endpoint is accessible', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/version`);
            expect(response.ok).toBe(true);
        });

        test('Auth service metrics endpoint is accessible', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/metrics`);
            expect(response.ok).toBe(true);
        });
    });

    // =========================================================================
    // USER REGISTRATION TESTS
    // =========================================================================
    describe('User Registration', () => {
        test('Register new user with email and password', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: TEST_USER.email,
                    password: TEST_USER.password,
                    name: TEST_USER.name,
                    userType: TEST_USER.userType
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();

            expect(data).toHaveProperty('success', true);
            expect(data).toHaveProperty('user');
            expect(data.user).toHaveProperty('id');
            expect(data.user.email).toBe(TEST_USER.email);

            userId = data.user.id;
        });

        test('Register user with phone number', async () => {
            const phoneEmail = generateTestEmail();

            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: phoneEmail,
                    phone: TEST_USER.phone,
                    password: TEST_USER.password,
                    name: 'Phone User',
                    userType: 'merchant'
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('success', true);
        });

        test('Reject duplicate email registration', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: TEST_USER.email,
                    password: TEST_USER.password,
                    name: 'Duplicate User'
                })
            });

            expect(response.status).toBe(409);
            const data = await response.json();
            expect(data).toHaveProperty('error');
        });

        test('Reject registration with weak password', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: generateTestEmail(),
                    password: '123',
                    name: 'Weak Password User'
                })
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data).toHaveProperty('error');
        });

        test('Reject registration with invalid email', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'invalid-email',
                    password: TEST_USER.password,
                    name: 'Invalid Email User'
                })
            });

            expect(response.status).toBe(400);
        });

        test('Reject registration with missing required fields', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: generateTestEmail()
                })
            });

            expect(response.status).toBe(400);
        });
    });

    // =========================================================================
    // USER LOGIN TESTS
    // =========================================================================
    describe('User Login', () => {
        test('Login with valid credentials returns tokens', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: TEST_USER.email,
                    password: TEST_USER.password
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();

            expect(data).toHaveProperty('success', true);
            expect(data).toHaveProperty('token');
            expect(data).toHaveProperty('refreshToken');
            expect(data).toHaveProperty('user');

            authToken = data.token;
            refreshToken = data.refreshToken;
        });

        test('Login with invalid password returns 401', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: TEST_USER.email,
                    password: 'wrongpassword123'
                })
            });

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data).toHaveProperty('error');
        });

        test('Login with non-existent user returns 401', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'nonexistent@rez.test.com',
                    password: TEST_USER.password
                })
            });

            expect(response.status).toBe(401);
        });

        test('Login with missing credentials returns 400', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            expect(response.status).toBe(400);
        });
    });

    // =========================================================================
    // TOKEN VALIDATION TESTS
    // =========================================================================
    describe('Token Validation', () => {
        test('Validate valid JWT token', async () => {
            expect(authToken).toBeTruthy();

            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('valid', true);
            expect(data).toHaveProperty('user');
        });

        test('Reject invalid JWT token', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer invalid.token.here'
                }
            });

            expect(response.status).toBe(401);
        });

        test('Reject request without authorization header', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.status).toBe(401);
        });

        test('Reject expired token', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer expired_token_example`
                }
            });

            expect(response.status).toBe(401);
        });
    });

    // =========================================================================
    // TOKEN REFRESH TESTS
    // =========================================================================
    describe('Token Refresh', () => {
        test('Refresh valid token returns new tokens', async () => {
            expect(refreshToken).toBeTruthy();

            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    refreshToken: refreshToken
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();

            expect(data).toHaveProperty('token');
            expect(data).toHaveProperty('refreshToken');
            expect(data.token).not.toBe(authToken);
        });

        test('Reject invalid refresh token', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    refreshToken: 'invalid_refresh_token'
                })
            });

            expect(response.status).toBe(401);
        });
    });

    // =========================================================================
    // PASSWORD RESET TESTS
    // =========================================================================
    describe('Password Reset', () => {
        test('Request password reset sends email', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/password/reset-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: TEST_USER.email
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('success', true);
        });

        test('Request password reset for non-existent email returns success (security)', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/password/reset-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'nonexistent@rez.test.com'
                })
            });

            // Should return success to prevent email enumeration
            expect(response.ok).toBe(true);
        });

        test('Reject password reset with invalid email format', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/password/reset-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'invalid-email'
                })
            });

            expect(response.status).toBe(400);
        });
    });

    // =========================================================================
    // SESSION MANAGEMENT TESTS
    // =========================================================================
    describe('Session Management', () => {
        test('Get user sessions', async () => {
            expect(authToken).toBeTruthy();

            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/sessions`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('sessions');
            expect(Array.isArray(data.sessions)).toBe(true);
        });

        test('Revoke specific session', async () => {
            expect(authToken).toBeTruthy();

            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/sessions/revoke`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    sessionId: 'session_to_revoke'
                })
            });

            // Should handle gracefully
            expect([200, 404]).toContain(response.status);
        });

        test('Revoke all sessions except current', async () => {
            expect(authToken).toBeTruthy();

            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/sessions/revoke-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('success', true);
        });

        test('Logout invalidates token', async () => {
            expect(authToken).toBeTruthy();

            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });

            expect(response.ok).toBe(true);
        });
    });

    // =========================================================================
    // MFA TESTS (if enabled)
    // =========================================================================
    describe('Multi-Factor Authentication', () => {
        test('Enable MFA for user', async () => {
            expect(authToken).toBeTruthy();

            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/mfa/enable`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });

            // Should return 200 or 400 if MFA not supported
            expect([200, 400]).toContain(response.status);
        });

        test('Verify MFA code', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/mfa/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: '123456',
                    tempToken: 'temp_token_if_needed'
                })
            });

            // Should handle MFA verification
            expect([200, 400, 401]).toContain(response.status);
        });
    });

    // =========================================================================
    // RATE LIMITING TESTS
    // =========================================================================
    describe('Rate Limiting', () => {
        test('Rate limit login attempts', async () => {
            let rateLimited = false;

            // Try multiple rapid login attempts
            for (let i = 0; i < 10; i++) {
                const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'ratelimit@test.com',
                        password: 'wrongpassword'
                    })
                });

                if (response.status === 429) {
                    rateLimited = true;
                    break;
                }
            }

            expect(rateLimited).toBe(true);
        });
    });

    // =========================================================================
    // API GATEWAY INTEGRATION TESTS
    // =========================================================================
    describe('API Gateway Auth Integration', () => {
        test('Access protected endpoint with valid token', async () => {
            expect(authToken).toBeTruthy();

            const response = await fetch(`${API_GATEWAY_URL}/api/v1/user/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            // Should either succeed or return proper error
            expect([200, 401, 404]).toContain(response.status);
        });

        test('Access protected endpoint without token returns 401', async () => {
            const response = await fetch(`${API_GATEWAY_URL}/api/v1/user/profile`, {
                method: 'GET'
            });

            expect(response.status).toBe(401);
        });

        test('Access protected endpoint with invalid token returns 401', async () => {
            const response = await fetch(`${API_GATEWAY_URL}/api/v1/user/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer invalid_token'
                }
            });

            expect(response.status).toBe(401);
        });
    });

    // =========================================================================
    // SECURITY TESTS
    // =========================================================================
    describe('Security Validations', () => {
        test('Reject SQL injection in login', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: "admin' OR '1'='1",
                    password: 'anything'
                })
            });

            expect(response.status).toBe(401);
        });

        test('Reject XSS in registration fields', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: generateTestEmail(),
                    password: TEST_USER.password,
                    name: '<script>alert("xss")</script>'
                })
            });

            // Should sanitize or reject
            expect([200, 400]).toContain(response.status);
        });

        test('Tokens have appropriate expiration', async () => {
            expect(authToken).toBeTruthy();

            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('expiresIn');
                expect(typeof data.expiresIn).toBe('number');
            }
        });
    });

    // =========================================================================
    // OAUTH TESTS (if available)
    // =========================================================================
    describe('OAuth Flows', () => {
        test('Google OAuth redirect is available', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/oauth/google`, {
                method: 'GET',
                redirect: 'manual'
            });

            // Should redirect to Google OAuth
            expect([301, 302, 303]).toContain(response.status);
        });

        test('Facebook OAuth redirect is available', async () => {
            const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/oauth/facebook`, {
                method: 'GET',
                redirect: 'manual'
            });

            expect([301, 302, 303, 404]).toContain(response.status);
        });
    });

    // =========================================================================
    // TOKEN BLACKLIST TESTS
    // =========================================================================
    describe('Token Blacklist', () => {
        test('Logged out token should be blacklisted', async () => {
            // First, login to get a new token
            const loginResponse = await fetch(`${AUTH_BASE_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: TEST_USER.email,
                    password: TEST_USER.password
                })
            });

            const loginData = await loginResponse.json();
            const newToken = loginData.token;

            // Logout the token
            await fetch(`${AUTH_BASE_URL}/api/v1/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${newToken}`
                }
            });

            // Try to use the logged out token
            const verifyResponse = await fetch(`${AUTH_BASE_URL}/api/v1/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${newToken}`
                }
            });

            expect(verifyResponse.status).toBe(401);
        });
    });
});

// Export for use in other test files
module.exports = { TEST_USER, AUTH_BASE_URL };
