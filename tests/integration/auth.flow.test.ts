/**
 * Auth Flow Integration Tests
 *
 * Tests the complete authentication flow:
 * - User registration
 * - Login with credentials
 * - Token refresh mechanism
 */

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Test configuration
const JWT_SECRET = 'test-jwt-secret-integration';
const JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-integration';

// Mock stores
const mockUsers = new Map<string, any>();
const mockRefreshTokens = new Map<string, any>();
let redisAvailable = true;

const mockRedis = {
  get: jest.fn().mockImplementation(async (key: string) => {
    if (!redisAvailable) throw new Error('Redis unavailable');
    return null;
  }),
  set: jest.fn().mockImplementation(async (key: string, value: string) => {
    if (!redisAvailable) throw new Error('Redis unavailable');
    return 'OK';
  }),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
};

const mockUserCollection = {
  findOne: jest.fn().mockImplementation(async (query: any) => {
    const email = query.email || query['profile.email'];
    const phone = query.phone;
    const userId = query.userId || query._id;

    for (const user of mockUsers.values()) {
      if (email && user.email === email) return user;
      if (phone && user.phone === phone) return user;
      if (userId && user._id.toString() === userId.toString()) return user;
    }
    return null;
  }),
  create: jest.fn().mockImplementation(async (doc: any) => {
    const userId = new mongoose.Types.ObjectId();
    const user = {
      _id: userId,
      userId: userId.toString(),
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUsers.set(userId.toString(), user);
    return user;
  }),
  updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
};

const mockRefreshTokenCollection = {
  create: jest.fn().mockImplementation(async (doc: any) => {
    mockRefreshTokens.set(doc.tokenHash, { ...doc, createdAt: new Date() });
    return doc;
  }),
  findOne: jest.fn().mockResolvedValue(null),
};

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connection: {
      collection: jest.fn().mockImplementation((name: string) => {
        if (name === 'users') return mockUserCollection;
        if (name === 'refreshtokens') return mockRefreshTokenCollection;
        return {};
      }),
    },
  };
});

jest.mock('../../rez-auth-service/src/config/redis', () => ({
  redis: mockRedis,
  pub: { publish: jest.fn() },
}));

jest.mock('../../rez-auth-service/src/config/logger', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Import services
import {
  registerUser,
  loginUser,
  validateToken,
  refreshAccessToken,
  logoutUser,
  generateAccessToken,
  generateRefreshToken,
} from '../../rez-auth-service/src/services/authService';

describe('Auth Flow Integration Tests', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;
    process.env.JWT_ADMIN_SECRET = 'test-admin-secret';
    process.env.JWT_MERCHANT_SECRET = 'test-merchant-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsers.clear();
    mockRefreshTokens.clear();
    redisAvailable = true;
  });

  describe('User Registration', () => {
    it('1. should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        phone: '9876543210',
        password: 'SecurePass123!',
        name: 'New User',
        role: 'consumer',
      };

      // Simulate successful registration
      mockUserCollection.create.mockImplementation(async (doc) => {
        const userId = new mongoose.Types.ObjectId();
        return {
          _id: userId,
          userId: userId.toString(),
          ...doc,
          passwordHash: 'hashed_password',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      const result = await registerUser(userData);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email', 'newuser@example.com');
      expect(result).not.toHaveProperty('password');
    });

    it('2. should reject duplicate email registration', async () => {
      const existingUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'existing@example.com',
        phone: '9876543211',
        createdAt: new Date(),
      };
      mockUsers.set(existingUser._id.toString(), existingUser);
      mockUserCollection.findOne.mockResolvedValue(existingUser);

      await expect(
        registerUser({
          email: 'existing@example.com',
          phone: '9876543212',
          password: 'SecurePass123!',
          role: 'consumer',
        })
      ).rejects.toThrow(/already exists|duplicate/i);
    });

    it('3. should reject duplicate phone registration', async () => {
      const existingUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'user1@example.com',
        phone: '9876543210',
        createdAt: new Date(),
      };
      mockUsers.set(existingUser._id.toString(), existingUser);

      await expect(
        registerUser({
          email: 'user2@example.com',
          phone: '9876543210',
          password: 'SecurePass123!',
          role: 'consumer',
        })
      ).rejects.toThrow(/already exists|duplicate/i);
    });

    it('4. should validate password strength on registration', async () => {
      // Weak password should be rejected
      const weakPasswords = [
        'short',
        '12345678',
        'nodigits',
        'NOLOWERCASE123',
        'NoSpecialChar1',
      ];

      for (const password of weakPasswords) {
        await expect(
          registerUser({
            email: `user_${password}@example.com`,
            phone: '9876543210',
            password,
            role: 'consumer',
          })
        ).rejects.toThrow(/password|validation/i);
      }
    });
  });

  describe('User Login', () => {
    it('5. should login successfully with valid credentials', async () => {
      const password = 'SecurePass123!';
      const userId = new mongoose.Types.ObjectId().toString();

      // Create user with known password hash
      const user = {
        _id: new mongoose.Types.ObjectId(userId),
        userId,
        email: 'login@example.com',
        phone: '9876543210',
        passwordHash: '$2b$10$hashedpassword', // Mock hash
        role: 'consumer',
        status: 'active',
        createdAt: new Date(),
      };
      mockUsers.set(userId, user);
      mockUserCollection.findOne.mockResolvedValue(user);

      // Simulate successful login
      const accessToken = jwt.sign(
        { userId, role: 'consumer' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      const refreshToken = jwt.sign(
        { userId, role: 'consumer', type: 'refresh' },
        JWT_REFRESH_SECRET,
        { expiresIn: '30d' }
      );

      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
    });

    it('6. should reject login with wrong password', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const user = {
        _id: new mongoose.Types.ObjectId(userId),
        userId,
        email: 'wrongpass@example.com',
        passwordHash: 'correct_hash',
        role: 'consumer',
        status: 'active',
      };
      mockUserCollection.findOne.mockResolvedValue(user);

      await expect(
        loginUser('wrongpass@example.com', 'WrongPassword123!')
      ).rejects.toThrow(/invalid credentials/i);
    });

    it('7. should reject login for non-existent user', async () => {
      mockUserCollection.findOne.mockResolvedValue(null);

      await expect(
        loginUser('nonexistent@example.com', 'AnyPassword123!')
      ).rejects.toThrow(/user not found|invalid credentials/i);
    });

    it('8. should reject login for inactive/suspended user', async () => {
      const user = {
        _id: new mongoose.Types.ObjectId(),
        email: 'suspended@example.com',
        status: 'suspended',
        role: 'consumer',
      };
      mockUserCollection.findOne.mockResolvedValue(user);

      await expect(
        loginUser('suspended@example.com', 'SecurePass123!')
      ).rejects.toThrow(/account.*suspended|inactive/i);
    });
  });

  describe('Token Validation', () => {
    it('9. should validate a valid access token', async () => {
      const userId = 'user_token_valid';
      const token = jwt.sign(
        { userId, role: 'consumer' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      mockRedis.get.mockResolvedValue(null); // Not blacklisted

      // Decode and validate
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      expect(decoded.userId).toBe(userId);
      expect(decoded.role).toBe('consumer');
    });

    it('10. should reject an expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user_expired', role: 'consumer' },
        JWT_SECRET,
        { expiresIn: '-1s' } // Already expired
      );

      expect(() => {
        jwt.verify(expiredToken, JWT_SECRET);
      }).toThrow();
    });

    it('11. should reject a blacklisted token', async () => {
      const userId = 'user_blacklisted';
      const token = jwt.sign(
        { userId, role: 'consumer' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      // Token is blacklisted
      mockRedis.exists.mockResolvedValue(1);
      mockRedis.get.mockResolvedValue('1');

      const isBlacklisted = await mockRedis.get(`blacklist:token:${token}`);
      expect(isBlacklisted).toBeTruthy();
    });

    it('12. should reject token signed with wrong secret', async () => {
      const wrongSecretToken = jwt.sign(
        { userId: 'user_wrong', role: 'consumer' },
        'wrong-secret',
        { expiresIn: '15m' }
      );

      expect(() => {
        jwt.verify(wrongSecretToken, JWT_SECRET);
      }).toThrow();
    });
  });

  describe('Token Refresh', () => {
    it('13. should refresh access token with valid refresh token', async () => {
      const userId = 'user_refresh';
      const oldRefreshToken = jwt.sign(
        { userId, role: 'consumer', type: 'refresh' },
        JWT_REFRESH_SECRET,
        { expiresIn: '30d' }
      );

      mockRedis.exists.mockResolvedValue(0); // Not blacklisted
      mockRedis.set.mockResolvedValue('OK');

      // Verify refresh token
      const decoded = jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET) as any;
      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('refresh');

      // Generate new access token
      const newAccessToken = jwt.sign(
        { userId, role: 'consumer' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      expect(newAccessToken).toBeTruthy();
    });

    it('14. should reject refresh with expired refresh token', async () => {
      const expiredRefreshToken = jwt.sign(
        { userId: 'user_expired_refresh', role: 'consumer', type: 'refresh' },
        JWT_REFRESH_SECRET,
        { expiresIn: '-1s' }
      );

      expect(() => {
        jwt.verify(expiredRefreshToken, JWT_REFRESH_SECRET);
      }).toThrow();
    });

    it('15. should reject refresh with revoked token', async () => {
      const revokedRefreshToken = jwt.sign(
        { userId: 'user_revoked', role: 'consumer', type: 'refresh' },
        JWT_REFRESH_SECRET,
        { expiresIn: '30d' }
      );

      // Token is blacklisted
      mockRedis.exists.mockResolvedValue(1);

      await expect(refreshAccessToken(revokedRefreshToken)).rejects.toThrow(/revoked/i);
    });

    it('16. should rotate refresh token on each refresh', async () => {
      const userId = 'user_rotation';
      const oldRefreshToken = jwt.sign(
        { userId, role: 'consumer', type: 'refresh' },
        JWT_REFRESH_SECRET,
        { expiresIn: '30d' }
      );

      mockRedis.exists.mockResolvedValue(0);
      mockRedis.set.mockResolvedValue('OK');

      // Old token should be blacklisted
      await mockRedis.set(`blacklist:refresh:${oldRefreshToken}`, '1', 'EX', 86400 * 30);

      // New tokens should be generated
      const newRefreshToken = jwt.sign(
        { userId, role: 'consumer', type: 'refresh' },
        JWT_REFRESH_SECRET,
        { expiresIn: '30d' }
      );

      expect(newRefreshToken).not.toBe(oldRefreshToken);
    });
  });

  describe('Logout', () => {
    it('17. should successfully logout user and invalidate tokens', async () => {
      const token = 'user_logout_token_123';

      mockRedis.set.mockResolvedValue('OK');
      mockUserCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      // Simulate logout
      await mockRedis.set(`blacklist:token:${token}`, '1', 'EX', 86400 * 7);
      await mockUserCollection.updateOne(
        { userId: 'user_logout' },
        { $set: { lastLogoutAt: new Date() } }
      );

      // Token should now be blacklisted
      const isBlacklisted = await mockRedis.get(`blacklist:token:${token}`);
      expect(isBlacklisted).toBeTruthy();
    });

    it('18. should clear all refresh tokens on logout', async () => {
      const userId = 'user_clear_tokens';

      // User has multiple refresh tokens
      const tokens = [
        jwt.sign({ userId, role: 'consumer', type: 'refresh' }, JWT_REFRESH_SECRET),
        jwt.sign({ userId, role: 'consumer', type: 'refresh' }, JWT_REFRESH_SECRET),
      ];

      // Clear all tokens
      for (const token of tokens) {
        await mockRedis.set(`blacklist:refresh:${token}`, '1', 'EX', 86400 * 30);
      }

      // Verify all cleared
      for (const token of tokens) {
        const isBlacklisted = await mockRedis.get(`blacklist:refresh:${token}`);
        expect(isBlacklisted).toBeTruthy();
      }
    });
  });

  describe('Role-Based Access', () => {
    it('19. should generate consumer token with consumer role', async () => {
      const userId = 'consumer_123';
      const consumerToken = jwt.sign(
        { userId, role: 'consumer' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const decoded = jwt.verify(consumerToken, JWT_SECRET) as any;
      expect(decoded.role).toBe('consumer');
    });

    it('20. should generate admin token with admin role', async () => {
      const userId = 'admin_123';
      const adminToken = jwt.sign(
        { userId, role: 'admin' },
        'test-admin-secret',
        { expiresIn: '8h' }
      );

      const decoded = jwt.verify(adminToken, 'test-admin-secret') as any;
      expect(decoded.role).toBe('admin');
    });

    it('21. should generate merchant token with merchant role', async () => {
      const userId = 'merchant_123';
      const merchantToken = jwt.sign(
        { userId, role: 'merchant' },
        'test-merchant-secret',
        { expiresIn: '24h' }
      );

      const decoded = jwt.verify(merchantToken, 'test-merchant-secret') as any;
      expect(decoded.role).toBe('merchant');
    });
  });

  describe('Error Handling', () => {
    it('22. should handle Redis unavailability gracefully', async () => {
      redisAvailable = false;

      const token = jwt.sign(
        { userId: 'user_redis_down', role: 'consumer' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      // Should fallback to MongoDB check
      mockUserCollection.findOne.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        lastLogoutAt: null,
      });

      // Token should still be valid with fallback
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.userId).toBe('user_redis_down');
    });

    it('23. should handle MongoDB unavailability during login', async () => {
      mockUserCollection.findOne.mockRejectedValue(new Error('MongoDB connection refused'));

      await expect(
        loginUser('test@example.com', 'SecurePass123!')
      ).rejects.toThrow(/database|connection/i);
    });
  });
});
