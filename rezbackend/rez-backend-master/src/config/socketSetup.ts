// @ts-nocheck
/**
 * config/socketSetup.ts — Socket.IO setup and event handlers
 * Extracted from server.ts for maintainability.
 */
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from './logger';
import { getAllowedOrigins } from './middleware';
import { initializeSocket } from './socket';
import { attachRedisAdapter } from './socketAdapter';
import { isGamificationEnabled } from './gamificationFeatureFlags';
import stockSocketService from '../services/stockSocketService';
import earningsSocketService from '../services/earningsSocketService';
import gamificationSocketService from '../services/gamificationSocketService';
import { RealTimeService } from '../merchantservices/RealTimeService';
import { Order } from '../models/Order';
import { Store } from '../models/Store';

declare global {
  var io: any;
  var realTimeService: any;
}

// WebSocket Security Audit Fixes: Imports for Redis-backed rate limiting
// Lazy import to avoid circular dependencies during module initialization
let redisClient: any = null;
async function getRedisClient() {
  if (!redisClient) {
    try {
      const redis = require('./redis');
      redisClient = redis.redis;
    } catch (err) {
      logger.warn('[Socket] Redis not available for rate limiting:', err.message);
    }
  }
  return redisClient;
}

// WebSocket Security Metrics
const wsSecurityMetrics = {
  tableAuthFailures: 0,
  tableRateLimited: 0,
  tableMessagesTotal: 0,
  orderSubscriptionUnauthorized: 0,
};

/**
 * Creates the Socket.IO server, registers event handlers, and initializes
 * socket-dependent services (stock, earnings, gamification, real-time).
 *
 * Returns the io instance for use by startServer (Redis adapter attachment).
 */
// MP-D006: Maximum simultaneous Socket.IO connections this process will accept.
// Without a ceiling, a flood of clients (bots, retry storms, mobile reconnects)
// continuously increases per-socket memory (rooms Map, event listener arrays,
// write-buffer queues) until the process exhausts its RSS limit.
// Set via MAX_SOCKET_CONNECTIONS env var; default 5 000 is a safe upper bound
// for a single Node process handling ~2 KB of socket state each.
const MAX_SOCKET_CONNECTIONS = parseInt(process.env.MAX_SOCKET_CONNECTIONS || '5000', 10);

export function setupSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || getAllowedOrigins(),
      methods: ['GET', 'POST'],
    },
    maxHttpBufferSize: 1e4, // 10 KB max payload (prevents memory exhaustion)
    pingTimeout: 10_000, // 10s (faster dead socket cleanup)
    pingInterval: 25_000, // 25s keepalive
    connectTimeout: 10_000, // 10s to complete handshake
    transports: ['websocket', 'polling'],
  });

  // MP-D006 FIX: Enforce a hard ceiling on concurrent socket connections.
  // Socket.IO does not provide a built-in connection cap; we implement one via
  // a middleware that counts live sockets before the handshake completes.
  // Connections beyond the limit are rejected with error code 429 so clients
  // can implement back-off.  This middleware runs BEFORE authentication so we
  // drop excess anonymous sockets before they consume any heap state.
  io.use((socket, next) => {
    const currentCount = io.sockets.sockets.size;
    if (currentCount >= MAX_SOCKET_CONNECTIONS) {
      logger.warn(`[Socket] Connection rejected — at capacity (${currentCount}/${MAX_SOCKET_CONNECTIONS})`, {
        remoteAddress: socket.handshake.address,
      });
      return next(new Error('TOO_MANY_CONNECTIONS'));
    }
    next();
  });

  // ── KDS (Kitchen Display System) namespace ──
  const kdsNamespace = io.of('/kds');
  kdsNamespace.use(async (socket: any, next: any) => {
    // BUG-023 FIX: Accept tokens only from socket.handshake.auth, not from the
    // query string. Query-string tokens are visible in server logs, reverse-proxy
    // access logs, and browser history, making them trivially leakable.
    // This matches the security policy enforced on the main namespace below.
    //
    // KDS-SEC-001 FIX: Previously the KDS namespace tried JWT_SECRET, then
    // JWT_MERCHANT_SECRET, then JWT_ADMIN_SECRET in sequence, meaning a consumer
    // token (signed with JWT_SECRET) could connect to the kitchen display system
    // and receive live order updates intended only for merchants.
    //
    // Fix: verify exclusively with JWT_MERCHANT_SECRET and require role === 'merchant'.
    // Consumer and admin tokens are rejected outright — they must connect to the
    // main namespace instead.
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const jwt = require('jsonwebtoken');

      if (!process.env.JWT_MERCHANT_SECRET) {
        logger.error('[KDS] JWT_MERCHANT_SECRET is not configured');
        return next(new Error('Server authentication misconfiguration'));
      }

      // Verify exclusively with the merchant secret — any other token type is rejected.
      // CVE-2015-9235 FIX: Pin algorithm to HS256 only.
      const decoded = jwt.verify(token, process.env.JWT_MERCHANT_SECRET, { algorithms: ['HS256'] }) as any;

      if (!decoded || decoded.role !== 'merchant') {
        return next(new Error('KDS access requires merchant token'));
      }

      socket.merchantId = decoded.merchantId || decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  kdsNamespace.on('connection', (socket: any) => {
    logger.info('[KDS] Kitchen display connected', { socketId: socket.id, merchantId: socket.merchantId });

    /**
     * Handle kitchen display joining a store's KDS room
     */
    socket.on('join-store', async ({ storeId }: { storeId: string }, callback?: any) => {
      // KDS-OWN-001: Verify the authenticated merchant owns the requested store
      // before joining the KDS room. socket.merchantId is set during JWT
      // verification in the KDS namespace auth middleware above.
      if (!storeId || typeof storeId !== 'string' || storeId.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(storeId)) {
        if (callback) callback({ success: false, error: 'Invalid storeId' });
        return;
      }

      try {
        const { Store } = require('../models/Store');
        const store = await Store.findById(storeId).select('merchant').lean();
        if (!store || String(store.merchant) !== String(socket.merchantId)) {
          logger.warn('[KDS] Unauthorized join-store attempt', {
            socketId: socket.id,
            merchantId: socket.merchantId,
            storeId,
          });
          if (callback) callback({ success: false, error: 'Unauthorized' });
          return;
        }
      } catch (err) {
        logger.error('[KDS] Store ownership lookup failed', { storeId, err });
        if (callback) callback({ success: false, error: 'Server error' });
        return;
      }

      socket.join(`kds:${storeId}`);
      logger.info('[KDS] Display joined store', { storeId, socketId: socket.id });
      socket.emit('kds:joined', { storeId, timestamp: new Date().toISOString() });
      if (callback) callback({ success: true, storeId });
    });

    /**
     * Load current orders for the store (for initial page load)
     */
    socket.on('get-current-orders', async ({ storeId }: any, callback?: any) => {
      // KDS-OWN-002: Verify the authenticated merchant owns the requested store
      // before returning any order data. Without this check any authenticated
      // merchant could query orders from a competitor's store by supplying an
      // arbitrary storeId. Mirror the same ownership guard used in join-store.
      if (!storeId || typeof storeId !== 'string' || storeId.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(storeId)) {
        if (callback) callback({ success: false, error: 'Invalid storeId' });
        return;
      }

      try {
        const { Store } = require('../models/Store');
        const store = await Store.findById(storeId).select('merchant merchantId').lean();
        if (!store || String(store.merchantId || store.merchant) !== String(socket.merchantId)) {
          logger.warn('[KDS] Unauthorized get-current-orders attempt', {
            socketId: socket.id,
            merchantId: socket.merchantId,
            storeId,
          });
          socket.emit('error', { message: 'Unauthorized: store not found or access denied' });
          if (callback) callback({ success: false, error: 'Unauthorized' });
          return;
        }
      } catch (err) {
        logger.error('[KDS] Store ownership lookup failed in get-current-orders', { storeId, err });
        if (callback) callback({ success: false, error: 'Server error' });
        return;
      }

      try {
        const { Order } = require('../models/Order');
        const { logger } = require('../config/logger');

        // Find all non-delivered, non-cancelled orders for this store
        const orders = await Order.find({
          store: storeId,
          status: {
            $in: ['confirmed', 'preparing', 'ready', 'dispatched', 'out_for_delivery'],
          },
          deletedAt: null,
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .select(
            'orderNumber items status payment delivery timeline specialInstructions createdAt updatedAt kitchenItemStatus',
          );

        const formattedOrders = orders.map((order: any) => ({
          id: order._id,
          orderNumber: order.orderNumber,
          customerName: order.delivery?.address?.name,
          orderType: order.fulfillmentType,
          status: order.status,
          priority: determinePriority(order),
          items: order.items.map((item: any) => ({
            id: item._id,
            name: item.name,
            quantity: item.quantity,
            modifications: item.variant ? [`${item.variant.type}: ${item.variant.value}`] : [],
            cookingTime: 15, // Default - can be customized per item type
            station: 'main',
            status: getItemStatus(order.kitchenItemStatus?.[item._id?.toString()]),
            allergens: item.allergens || [],
            price: item.price,
          })),
          totalItems: order.items.length,
          estimatedTime: 15,
          elapsedTime: 0,
          orderTime: new Date(order.createdAt).toLocaleTimeString(),
          specialInstructions: order.specialInstructions,
          allergens: [],
          station: 'mixed',
          createdAt: order.createdAt,
          storeId: storeId,
        }));

        if (callback) {
          callback({ success: true, orders: formattedOrders });
        }
      } catch (error) {
        logger.error('[KDS] Error getting current orders:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to load orders' });
        }
      }
    });

    /**
     * Handle order status changes from kitchen display
     */
    socket.on('order:mark-preparing', ({ orderId, storeId }: any) => {
      kdsNamespace.to(`kds:${storeId}`).emit('kds:order-preparing', {
        orderId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('order:mark-ready', ({ orderId, storeId }: any) => {
      kdsNamespace.to(`kds:${storeId}`).emit('kds:order-ready', {
        orderId,
        timestamp: new Date().toISOString(),
      });
    });

    /**
     * Handle item status changes
     */
    socket.on('item-status-changed', ({ orderId, itemId, status, storeId }: any) => {
      // Broadcast to other kitchen displays so they see the change
      kdsNamespace.to(`kds:${storeId}`).emit('order:item_status_updated', {
        orderId,
        itemId,
        status,
        timestamp: new Date().toISOString(),
      });
      logger.info('[KDS] Item status changed broadcasted', { orderId, itemId, status });
    });

    socket.on('disconnect', () => {
      logger.info('[KDS] Kitchen display disconnected', { socketId: socket.id });
    });
  });

  /**
   * Helper function to determine priority based on order data
   */
  const determinePriority = (order: any): 'low' | 'normal' | 'high' | 'urgent' => {
    if (order.fulfillmentType === 'drive_thru' || order.fulfillmentType === 'dine_in') return 'high';
    if (order.delivery?.method === 'express') return 'urgent';
    return 'normal';
  };

  /**
   * Helper function to get item status from kitchenItemStatus map
   */
  const getItemStatus = (itemStatus: any): 'pending' | 'preparing' | 'ready' => {
    if (!itemStatus) return 'pending';
    return itemStatus.status || 'pending';
  };

  // Store kdsNamespace globally
  (global as any).kdsNamespace = kdsNamespace;

  // Register Socket.IO instance so services can emit events
  initializeSocket(io);

  // ── JWT authentication middleware ──
  // NOTE: Query-string token acceptance has been removed (socket.handshake.query?.token).
  // Tokens in the URL are visible in server logs, proxies, and browser history, making
  // them trivially leakable. Clients must supply the token via socket.handshake.auth.token
  // (the Socket.IO auth object is sent in the initial handshake body, not the URL).
  io.use((socket: any, next: any) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const jwt = require('jsonwebtoken');

      // Peek at the role / merchantId claims WITHOUT verification to select the
      // correct secret. This enforces that admin-role tokens must be signed with
      // JWT_ADMIN_SECRET, preventing a user token signed with JWT_SECRET from
      // claiming admin privileges.
      //
      // IMPORTANT: merchant tokens issued by rez-merchant-service carry
      // `role: 'owner' | 'manager' | 'staff' | 'cashier' | 'viewer'` — NOT the
      // literal string `'merchant'`. They do however always carry a `merchantId`
      // claim. Detect a merchant token by the presence of `merchantId` rather
      // than the `role` string, otherwise these tokens fall through to
      // JWT_SECRET (consumer) verification and every merchant socket handshake
      // fails with "Invalid or expired token".
      let peekDecoded: any;
      try {
        peekDecoded = jwt.decode(token);
      } catch {
        /* ignore */
      }
      const claimedRole: string = peekDecoded?.role || '';
      const hasMerchantId = Boolean(peekDecoded?.merchantId);
      const MERCHANT_ROLES = ['merchant', 'owner', 'manager', 'staff', 'cashier', 'viewer'];

      let selectedSecret: string;
      if (
        (claimedRole === 'admin' || claimedRole === 'super_admin' || claimedRole === 'superadmin') &&
        process.env.JWT_ADMIN_SECRET
      ) {
        selectedSecret = process.env.JWT_ADMIN_SECRET;
      } else if ((hasMerchantId || MERCHANT_ROLES.includes(claimedRole)) && process.env.JWT_MERCHANT_SECRET) {
        selectedSecret = process.env.JWT_MERCHANT_SECRET;
      } else {
        selectedSecret = process.env.JWT_SECRET!;
      }

      if (!selectedSecret) {
        return next(new Error('Server authentication misconfiguration'));
      }

      let decoded: { userId: string; role: string; merchantId?: string; id?: string } | null = null;
      // CVE-2015-9235 FIX: Pin algorithm to HS256 only.
      decoded = jwt.verify(token, selectedSecret, { algorithms: ['HS256'] }) as {
        userId: string;
        role: string;
        merchantId?: string;
        id?: string;
      };

      if (!decoded) {
        throw new Error('Token verification failed');
      }

      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      // Preserve merchantId from JWT so merchant room ownership can be validated
      socket.merchantId = decoded.merchantId || decoded.id;
      next();
    } catch (_err) {
      return next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ──
  io.on('connection', (socket: any) => {
    const userId = socket.userId;
    const userRole = socket.userRole;

    // Auto-join user's personal room
    socket.join(`user-${userId}`);
    logger.info(
      `[Socket] Connected: userId=${userId}, role=${userRole}, socketId=${socket.id}, rooms=[${[...socket.rooms].join(', ')}]`,
    );

    // Auto-join support-agents room for admin users
    if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'superadmin') {
      socket.join('support-agents');
      socket.join('admin');
      socket.join('admin-room');
      logger.info(`[Socket] Admin ${userId} joined support-agents, admin, admin-room rooms`);
    }

    // Validate socket input is a valid ID string (ObjectId-like: 24 hex chars or alphanumeric up to 50)
    const isValidSocketId = (val: unknown): val is string =>
      typeof val === 'string' && val.length > 0 && val.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(val);

    // Join merchant room (only if merchant/admin role, with ownership validation)
    socket.on('join-merchant-room', (merchantId: string) => {
      if (!isValidSocketId(merchantId)) return;

      // Admins can join any merchant room
      if (userRole === 'admin' || userRole === 'super_admin') {
        socket.join(`merchant-${merchantId}`);
        return;
      }

      // Merchants can only join their own room — verify JWT merchantId matches.
      // NOTE: Merchant tokens use role values like 'owner', 'manager', 'staff',
      // 'cashier', 'viewer' — NOT the literal string 'merchant'. Detect a
      // merchant token by the presence of socket.merchantId (set during JWT
      // verification in the auth middleware) regardless of role string.
      const MERCHANT_ROLES = ['merchant', 'owner', 'manager', 'staff', 'cashier', 'viewer'];
      if (socket.merchantId || MERCHANT_ROLES.includes(userRole)) {
        if (socket.merchantId && socket.merchantId === merchantId) {
          socket.join(`merchant-${merchantId}`);
        } else {
          socket.emit('error', { message: 'Unauthorized: merchant ID mismatch' });
          logger.warn(
            `[Socket] Merchant ${socket.merchantId} (role: ${userRole}) denied join to merchant room ${merchantId}`,
          );
        }
      }
    });

    // Join a specific support ticket room — ownership-checked for regular users.
    socket.on('join-support-ticket', async (ticketId: string) => {
      if (!isValidSocketId(ticketId)) return;

      // Admins and support can join any ticket
      if (['admin', 'super_admin', 'support'].includes(socket.userRole)) {
        socket.join(`support-ticket-${ticketId}`);
        return;
      }

      // Regular users can only join their own tickets
      try {
        const SupportTicket =
          require('../models/SupportTicket').default || require('../models/SupportTicket').SupportTicket;
        const ticket = await SupportTicket.findById(ticketId).select('user').lean();
        if (ticket && ticket.user?.toString() === socket.userId) {
          socket.join(`support-ticket-${ticketId}`);
        }
      } catch (err) {
        // Silently deny — don't leak ticket existence
      }
    });
    socket.on('join_ticket', async (data: any) => {
      const tid = typeof data === 'string' ? data : data?.ticketId;
      if (!isValidSocketId(tid)) return;

      // Admins and support can join any ticket
      if (['admin', 'super_admin', 'support'].includes(socket.userRole)) {
        socket.join(`support-ticket-${tid}`);
        return;
      }

      // Regular users can only join their own tickets
      try {
        const SupportTicket =
          require('../models/SupportTicket').default || require('../models/SupportTicket').SupportTicket;
        const ticket = await SupportTicket.findById(tid).select('user').lean();
        if (ticket && ticket.user?.toString() === socket.userId) {
          socket.join(`support-ticket-${tid}`);
        }
      } catch (err) {
        // Silently deny — don't leak ticket existence
      }
    });

    // Allow merchant app to subscribe to store-specific order rooms.
    // STORE-OWN-001: Only merchants who own the store (or admins) may join.
    // A DB lookup is required because socket.merchantId alone does not tell
    // us which stores belong to that merchant.
    socket.on('join-store', async (data: { storeId: string }) => {
      if (!data?.storeId || !isValidSocketId(data.storeId)) return;

      // Admins may join any store room
      if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'superadmin') {
        const room = `store-${data.storeId}`;
        socket.join(room);
        socket.emit('store-joined', { storeId: data.storeId, room });
        logger.info(`[Socket] Admin ${userId} joined store room: ${room}`);
        return;
      }

      // Merchants must own the store
      const MERCHANT_ROLES = ['merchant', 'owner', 'manager', 'staff', 'cashier', 'viewer'];
      if (socket.merchantId || MERCHANT_ROLES.includes(userRole)) {
        try {
          const storeRecord = await Store.findById(data.storeId).select('merchant').lean();
          if (!storeRecord || String((storeRecord as any).merchant) !== String(socket.merchantId)) {
            socket.emit('error', { message: 'Unauthorized: store does not belong to your merchant account' });
            logger.warn(
              `[Socket] Merchant ${socket.merchantId} (role: ${userRole}) denied join to store room ${data.storeId}`,
            );
            return;
          }
        } catch (lookupErr) {
          logger.error('[Socket] Store ownership lookup failed', { storeId: data.storeId, lookupErr });
          return;
        }
        const room = `store-${data.storeId}`;
        socket.join(room);
        socket.emit('store-joined', { storeId: data.storeId, room });
        logger.info(`[Socket] Merchant ${socket.merchantId} joined store room: ${room}`);
        return;
      }

      // All other roles (consumers etc.) are denied
      socket.emit('error', { message: 'Unauthorized: store rooms are restricted to merchants' });
      logger.warn(`[Socket] User ${userId} (role: ${userRole}) denied join to store room ${data.storeId}`);
    });

    socket.on('leave-store', (data: { storeId: string }) => {
      if (!data?.storeId || !isValidSocketId(data.storeId)) return;
      socket.leave(`store-${data.storeId}`);
    });

    // Leave a specific support ticket room
    socket.on('leave-support-ticket', (ticketId: string) => {
      if (!isValidSocketId(ticketId)) return;
      socket.leave(`support-ticket-${ticketId}`);
    });
    socket.on('leave_ticket', (data: any) => {
      const tid = typeof data === 'string' ? data : data?.ticketId;
      if (isValidSocketId(tid)) socket.leave(`support-ticket-${tid}`);
    });

    // Admin typing indicator for support chat
    socket.on('support-agent-typing', (data: { ticketId: string; isTyping: boolean }) => {
      if (!data || !isValidSocketId(data.ticketId)) return;
      if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'superadmin') {
        const event = data.isTyping ? 'support_agent_typing_start' : 'support_agent_typing_stop';
        socket.to(`support-ticket-${data.ticketId}`).emit(event, {
          ticketId: data.ticketId,
          agentId: userId,
        });
      }
    });

    // User typing indicator for support chat — ownership-checked for regular users
    socket.on('support-user-typing', async (data: { ticketId: string; isTyping: boolean }) => {
      if (!data || !isValidSocketId(data.ticketId)) return;

      // Admins and support agents may broadcast typing indicators for any ticket
      if (!['admin', 'super_admin', 'support'].includes(socket.userRole)) {
        // Regular users must own the ticket before broadcasting a typing indicator
        try {
          const SupportTicket =
            require('../models/SupportTicket').default || require('../models/SupportTicket').SupportTicket;
          const ticket = await SupportTicket.findById(data.ticketId).select('user').lean();
          if (!ticket || ticket.user?.toString() !== userId) {
            // Silently deny — do not leak ticket existence
            return;
          }
        } catch (_err) {
          return;
        }
      }

      const event = data.isTyping ? 'support_user_typing_start' : 'support_user_typing_stop';
      socket.to(`support-ticket-${data.ticketId}`).emit(event, {
        ticketId: data.ticketId,
        userId: userId,
      });
      // Also notify support-agents room
      socket.to('support-agents').emit(event, {
        ticketId: data.ticketId,
        userId: userId,
      });
    });

    // ── Staff: join store-specific staff room ──
    // Merchants and staff members join staff:<storeSlug> so they receive
    // table:message events forwarded from the /table customer namespace.
    socket.on('join-staff', async (data: { storeSlug: string }) => {
      if (!data?.storeSlug || !isValidSocketId(data.storeSlug)) return;

      const MERCHANT_ROLES = ['merchant', 'owner', 'manager', 'staff', 'cashier', 'viewer'];
      const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'superadmin';
      const isMerchant = socket.merchantId || MERCHANT_ROLES.includes(userRole);

      if (!isAdmin && !isMerchant) {
        socket.emit('error', { message: 'Unauthorized: staff rooms require merchant or admin token' });
        return;
      }

      // Merchants must own a store with this slug
      if (!isAdmin) {
        try {
          const storeRecord = await Store.findOne({ slug: data.storeSlug }).select('merchant').lean();
          if (!storeRecord || String((storeRecord as any).merchant) !== String(socket.merchantId)) {
            socket.emit('error', { message: 'Unauthorized: store does not belong to your merchant account' });
            logger.warn(`[Socket] Merchant ${socket.merchantId} denied join-staff for slug ${data.storeSlug}`);
            return;
          }
        } catch (err) {
          logger.error('[Socket] join-staff store lookup failed', { storeSlug: data.storeSlug, err });
          return;
        }
      }

      socket.join(`staff:${data.storeSlug}`);
      socket.emit('staff-joined', { storeSlug: data.storeSlug });
      logger.info(`[Socket] User ${userId} (role: ${userRole}) joined staff room for store: ${data.storeSlug}`);
    });

    socket.on('disconnect', () => {
      // cleanup handled by socket.io automatically
    });
  });

  // ── /table namespace — customer table chat with CAPTCHA/token authentication ──
  // Customers do not carry a JWT, so table messages use CAPTCHA verification or
  // short-lived table tokens. Messages are validated and forwarded to the
  // authenticated staff:<storeSlug> room on the main namespace.
  //
  // SECURITY AUDIT FIX WS-001: Added authentication middleware to prevent:
  //   - Anonymous spam/abuse
  //   - Store slug enumeration
  //   - Rate-limited DoS attacks
  const tableNamespace = io.of('/table');

  // TABLE-SEC-001: Authentication middleware for /table namespace
  // Accepts either a CAPTCHA token (from reCAPTCHA/HCaptcha) or a short-lived
  // table token (issued when customer opens the order page).
  tableNamespace.use(async (socket: any, next: any) => {
    const captchaToken = socket.handshake.auth?.captchaToken;
    const tableToken = socket.handshake.auth?.tableToken;

    // Check if CAPTCHA verification is enabled
    const captchaSecret = process.env.CAPTCHA_SECRET_KEY;
    const captchaSiteKey = process.env.CAPTCHA_SITE_KEY;

    if (captchaSecret && captchaSiteKey && captchaToken) {
      // Verify CAPTCHA token
      try {
        const crypto = require('crypto');
        const params = new URLSearchParams();
        params.append('secret', captchaSecret);
        params.append('response', captchaToken);

        // Use native fetch to verify with CAPTCHA provider
        const response = await fetch('https://hcaptcha.com/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });

        if (!response.ok) {
          throw new Error(`CAPTCHA verification failed: ${response.status}`);
        }

        const result = await response.json() as { success: boolean };
        if (!result.success) {
          wsSecurityMetrics.tableAuthFailures++;
          logger.warn('[Table] CAPTCHA verification failed', {
            socketId: socket.id,
            remoteAddress: socket.handshake.address,
          });
          return next(new Error('CAPTCHA verification failed'));
        }
      } catch (err) {
        wsSecurityMetrics.tableAuthFailures++;
        logger.warn('[Table] CAPTCHA verification error:', err);
        return next(new Error('CAPTCHA verification failed'));
      }
    } else if (tableToken) {
      // Verify short-lived table token
      // Token format: base64({ storeSlug, tableNumber, exp: timestamp, sig: HMAC })
      try {
        const jwt = require('jsonwebtoken');
        const tableTokenSecret = process.env.TABLE_TOKEN_SECRET;

        if (!tableTokenSecret) {
          logger.error('[Table] TABLE_TOKEN_SECRET not configured');
          return next(new Error('Server misconfiguration'));
        }

        // Verify token with HMAC
        const decoded = jwt.verify(tableToken, tableTokenSecret, { algorithms: ['HS256'] }) as {
          storeSlug: string;
          tableNumber: string;
          exp: number;
        };

        // Check expiration
        if (!decoded || decoded.exp < Date.now()) {
          wsSecurityMetrics.tableAuthFailures++;
          return next(new Error('Table token expired'));
        }

        // Store decoded info on socket for message validation
        socket.tableStoreSlug = decoded.storeSlug;
        socket.tableNumber = decoded.tableNumber;
      } catch (err: any) {
        wsSecurityMetrics.tableAuthFailures++;
        logger.warn('[Table] Table token verification failed:', err.message);
        return next(new Error('Invalid table token'));
      }
    } else {
      // No authentication provided
      wsSecurityMetrics.tableAuthFailures++;
      logger.warn('[Table] No authentication provided', {
        socketId: socket.id,
        remoteAddress: socket.handshake.address,
      });
      return next(new Error('Authentication required. Provide captchaToken or tableToken.'));
    }

    next();
  });

  // TABLE-SEC-002: Redis-backed global rate limiting
  // Replaces the per-socket rate limit with an IP-based limit using Redis.
  // This prevents attackers from opening multiple sockets to bypass rate limits.
  const TABLE_RATE_LIMIT = 10; // messages per minute per IP
  const TABLE_RATE_WINDOW = 60; // seconds

  // Fallback per-socket rate limit if Redis is unavailable
  const tableMessageCounts = new Map<string, { count: number; resetAt: number }>();

  // Helper function for Redis-backed rate limiting
  async function checkTableRateLimit(socket: any): Promise<{ allowed: boolean; retryAfter?: number }> {
    const ip = socket.handshake.address?.replace(/^::ffff:/, '') || 'unknown';
    const redis = await getRedisClient();

    if (redis) {
      try {
        const key = `ratelimit:table:ip:${ip}`;
        const count = await redis.incr(key);

        // Set expiry on first request in window
        if (count === 1) {
          await redis.expire(key, TABLE_RATE_WINDOW);
        }

        if (count > TABLE_RATE_LIMIT) {
          wsSecurityMetrics.tableRateLimited++;
          const ttl = await redis.ttl(key);
          return { allowed: false, retryAfter: ttl > 0 ? ttl : TABLE_RATE_WINDOW };
        }

        return { allowed: true };
      } catch (err) {
        logger.warn('[Table] Redis rate limit check failed, falling back to per-socket limit');
      }
    }

    // Fallback: per-socket rate limiting
    const now = Date.now();
    const entry = tableMessageCounts.get(socket.id);
    if (entry && now < entry.resetAt) {
      if (entry.count >= TABLE_RATE_LIMIT) {
        wsSecurityMetrics.tableRateLimited++;
        return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
      }
      entry.count++;
    } else {
      tableMessageCounts.set(socket.id, { count: 1, resetAt: now + TABLE_RATE_WINDOW * 1000 });
    }

    return { allowed: true };
  }

  tableNamespace.on('connection', (socket: any) => {
    logger.info('[Table] Customer connected', {
      socketId: socket.id,
      remoteAddress: socket.handshake.address,
      hasTableToken: !!socket.tableStoreSlug,
    });

    socket.on(
      'table:message',
      async (data: { storeSlug: string; tableNumber: string; message: string; customerName?: string }) => {
        // If authenticated via table token, validate message is for the authorized store/table
        if (socket.tableStoreSlug) {
          if (data.storeSlug !== socket.tableStoreSlug) {
            socket.emit('table:message:error', { message: 'Unauthorized for this store' });
            logger.warn('[Table] Customer attempted to message wrong store', {
              socketId: socket.id,
              authorized: socket.tableStoreSlug,
              attempted: data.storeSlug,
            });
            return;
          }
        }

        // Input validation
        if (
          typeof data?.storeSlug !== 'string' ||
          !/^[a-zA-Z0-9_-]{1,50}$/.test(data.storeSlug) ||
          typeof data?.tableNumber !== 'string' ||
          data.tableNumber.length === 0 ||
          data.tableNumber.length > 20 ||
          typeof data?.message !== 'string' ||
          data.message.trim().length === 0
        ) {
          socket.emit('table:message:error', { message: 'Invalid input' });
          return;
        }

        // TABLE-SEC-002: Global rate limit check
        const rateCheck = await checkTableRateLimit(socket);
        if (!rateCheck.allowed) {
          socket.emit('table:rate_limited', {
            message: 'Too many messages. Please wait.',
            retryAfter: rateCheck.retryAfter,
          });
          return;
        }

        wsSecurityMetrics.tableMessagesTotal++;

        const payload = {
          id: Date.now().toString(),
          tableNumber: data.tableNumber,
          message: data.message.slice(0, 500),
          customerName: (data.customerName ?? 'Guest').slice(0, 50),
          timestamp: new Date().toISOString(),
        };

        // Forward to staff room on the main namespace
        io.to(`staff:${data.storeSlug}`).emit('table:message', payload);
        logger.info('[Table] Message forwarded to staff', {
          storeSlug: data.storeSlug,
          tableNumber: data.tableNumber,
          socketId: socket.id,
        });

        // Acknowledge delivery to the customer
        socket.emit('table:message:ack', { id: payload.id, timestamp: payload.timestamp });
      },
    );

    socket.on('disconnect', () => {
      logger.info('[Table] Customer disconnected', { socketId: socket.id });
    });
  });

  // ── Set globals ──
  global.io = io;

  // Initialize socket-dependent services
  stockSocketService.initialize(io);
  earningsSocketService.initialize(io);

  if (isGamificationEnabled('tournaments')) {
    gamificationSocketService.initialize(io);
  }

  const realTimeServiceInstance = RealTimeService.getInstance(io);
  global.realTimeService = realTimeServiceInstance;

  return io;
}

/**
 * Helper function to emit events to KDS (Kitchen Display System) namespace
 */
export function emitToKDS(storeId: string, event: string, data: any): void {
  const kdsNamespace = (global as any).kdsNamespace;
  if (kdsNamespace) {
    kdsNamespace.to(`kds:${storeId}`).emit(event, data);
  } else {
    logger.warn('[KDS] Namespace not available for emitting event:', event);
  }
}

/**
 * Attaches the Redis adapter to Socket.IO (call after Redis is connected).
 */
export async function attachSocketRedisAdapter(io: SocketIOServer): Promise<void> {
  try {
    await attachRedisAdapter(io);
  } catch (err) {
    logger.error('[Socket.IO] Redis adapter failed, using in-memory fallback:', err);
  }
}

/**
 * TABLE-SEC-003: Get WebSocket security metrics for monitoring/alerting
 *
 * Metrics exported:
 *   - tableAuthFailures: Count of failed authentication attempts to /table namespace
 *   - tableRateLimited: Count of rate-limited messages on /table namespace
 *   - tableMessagesTotal: Total messages sent via /table namespace
 *   - orderSubscriptionUnauthorized: Count of unauthorized order subscription attempts
 *
 * Usage: Import and call getSocketSecurityMetrics() in monitoring endpoints
 */
export function getSocketSecurityMetrics(): {
  tableAuthFailures: number;
  tableRateLimited: number;
  tableMessagesTotal: number;
  orderSubscriptionUnauthorized: number;
} {
  return { ...wsSecurityMetrics };
}

/**
 * TABLE-SEC-003: Reset WebSocket security metrics (for testing)
 */
export function resetSocketSecurityMetrics(): void {
  wsSecurityMetrics.tableAuthFailures = 0;
  wsSecurityMetrics.tableRateLimited = 0;
  wsSecurityMetrics.tableMessagesTotal = 0;
  wsSecurityMetrics.orderSubscriptionUnauthorized = 0;
}
