/**
 * Order Intent Handler
 * Handles REZ-support-copilot → rez-order-service for order-related intents
 *
 * Features:
 * - Detect "track order" intent
 * - Handle order status queries
 * - Process order issues
 */

const orderService = require('../services/orderServiceIntegration');

class OrderIntentHandler {
  constructor() {
    // Order tracking keywords
    this.trackingPatterns = [
      /\btrack\s+(my\s+)?order\b/i,
      /\bwhere\s+is\s+(my\s+)?order\b/i,
      /\bstatus\s+of\s+(my\s+)?order\b/i,
      /\border\s+(number|id|#)\s*[:.]?\s*([A-Z0-9-]+)/i,
      /\btracking\s+(number|id)\s*[:.]?\s*([A-Z0-9-]+)/i,
      /\bcheck\s+(my\s+)?order\b/i,
      /\bhas\s+(my\s+)?order\s+(arrived|delivered|shipped|dispatched)\b/i,
      /\bwhen\s+will\s+(my\s+)?order\s+(arrive|be\s+delivered)\b/i,
      /\border\s+ETA\b/i,
      /\bhow\s+(long|much\s+longer)\b.*\b(deliver|arrival|wait)\b/i,
    ];

    // Order issue keywords
    this.issuePatterns = [
      /\b(issue|problem|wrong|missing|cold|late)\b.*\b(order|food|delivery)\b/i,
      /\border\s+has\s+(not\s+)?arrived\b/i,
      /\bwrong\s+(item|food)\b/i,
      /\bmissing\s+(item|food)\b/i,
      /\bcancel\s+(my\s+)?order\b/i,
      /\brefund\b/i,
      /\bcomplaint\b.*\border\b/i,
    ];
  }

  /**
   * Detect if message is about order tracking
   */
  detectTrackingIntent(message) {
    const lowerMsg = message.toLowerCase();
    return this.trackingPatterns.some(pattern => pattern.test(lowerMsg));
  }

  /**
   * Detect if message is about an order issue
   */
  detectIssueIntent(message) {
    const lowerMsg = message.toLowerCase();
    return this.issuePatterns.some(pattern => pattern.test(lowerMsg));
  }

  /**
   * Extract order ID from message
   */
  extractOrderId(message) {
    // Try various patterns
    const patterns = [
      /order\s+(?:number|id|#)\s*[:.]?\s*([A-Z0-9-]{5,})/i,
      /tracking\s+(?:number|id)\s*[:.]?\s*([A-Z0-9-]{5,})/i,
      /([A-Z]{2,3}[-_]?\d{5,}[-_]?\d*)/i, // Common order ID formats
      /#?(\d{8,})/, // Numeric order IDs
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1].replace(/[-_]/g, '').toUpperCase();
      }
    }

    return null;
  }

  /**
   * Handle order-related message
   */
  async handle(message, context = {}) {
    const { userId, merchantId } = context;

    // First check if this is a tracking request
    if (this.detectTrackingIntent(message)) {
      return await this.handleTracking(message, userId);
    }

    // Check if this is an issue
    if (this.detectIssueIntent(message)) {
      return await this.handleIssue(message, userId, merchantId);
    }

    return null;
  }

  /**
   * Handle order tracking request
   */
  async handleTracking(message, userId) {
    const orderId = this.extractOrderId(message);

    if (orderId) {
      // Track specific order
      return await this.trackOrderById(orderId, userId);
    }

    // No order ID found - try to find user's recent order
    if (userId) {
      return await this.trackRecentOrder(userId);
    }

    return {
      intent: 'ORDER_TRACKING',
      found: false,
      message: "I'd be happy to help you track your order! Could you please provide your order number or order ID?",
      requiresOrderId: true,
    };
  }

  /**
   * Track order by specific order ID
   */
  async trackOrderById(orderId, userId) {
    const result = await orderService.getOrderStatus(orderId);

    if (!result.success) {
      return {
        intent: 'ORDER_TRACKING',
        found: false,
        message: result.error || "I couldn't find that order. Please check the order number and try again, or provide your user ID so I can look up your orders.",
        orderId,
        requiresUserId: !userId,
      };
    }

    const order = result.order;
    const trackingMessage = orderService.getTrackingMessage(order);

    return {
      intent: 'ORDER_TRACKING',
      found: true,
      orderId: order.orderId,
      message: trackingMessage,
      details: {
        status: order.status,
        stage: order.currentStage,
        estimatedDelivery: order.estimatedDelivery,
        items: order.items?.length || 0,
        total: order.total,
      },
      actions: this.getActionsForStatus(order.status),
    };
  }

  /**
   * Track user's most recent order
   */
  async trackRecentOrder(userId) {
    const result = await orderService.getUserOrders(userId, 1);

    if (!result.success || result.orders.length === 0) {
      return {
        intent: 'ORDER_TRACKING',
        found: false,
        message: "I couldn't find any recent orders for your account. Please provide your order number, or check if you're logged into the correct account.",
        requiresOrderId: true,
      };
    }

    const recentOrder = result.orders[0];
    const trackingMessage = orderService.getTrackingMessage({
      status: recentOrder.status,
      estimatedDelivery: recentOrder.estimatedDelivery,
      items: recentOrder.items,
    });

    return {
      intent: 'ORDER_TRACKING',
      found: true,
      orderId: recentOrder.id || recentOrder.orderId,
      message: `Your most recent order (${recentOrder.id || recentOrder.orderId}): ${trackingMessage}`,
      details: {
        status: recentOrder.status,
        items: recentOrder.items?.length || 0,
        total: recentOrder.total,
        createdAt: recentOrder.createdAt,
      },
      isRecentOrder: true,
      actions: this.getActionsForStatus(recentOrder.status),
    };
  }

  /**
   * Handle order issue
   */
  async handleIssue(message, userId, merchantId) {
    const orderId = this.extractOrderId(message);

    // Determine issue type
    const issueType = this.classifyIssue(message);

    if (orderId) {
      // Verify order and handle issue
      return await this.handleSpecificIssue(orderId, issueType, message, userId, merchantId);
    }

    // No order ID - get recent order if user is known
    if (userId) {
      const orders = await orderService.getUserOrders(userId, 5);
      if (orders.success && orders.orders.length > 0) {
        // Find the most relevant order for the issue
        const recentActiveOrder = orders.orders.find(
          o => !['delivered', 'cancelled'].includes(o.status?.toLowerCase())
        ) || orders.orders[0];

        return await this.handleSpecificIssue(
          recentActiveOrder.id || recentActiveOrder.orderId,
          issueType,
          message,
          userId,
          merchantId
        );
      }
    }

    return {
      intent: 'ORDER_ISSUE',
      found: false,
      message: "I'd like to help you with your order issue. Could you please provide your order number so I can look into this?",
      issueType,
      requiresOrderId: true,
    };
  }

  /**
   * Handle issue for specific order
   */
  async handleSpecificIssue(orderId, issueType, message, userId, merchantId) {
    const statusResult = await orderService.getOrderStatus(orderId);

    if (!statusResult.success) {
      return {
        intent: 'ORDER_ISSUE',
        found: false,
        message: "I couldn't find that order. Please check the order number and try again.",
        orderId,
      };
    }

    const order = statusResult.order;

    // Handle cancellation request
    if (issueType === 'cancellation') {
      const cancelCheck = await orderService.checkCancellationEligibility(orderId);

      if (!cancelCheck.eligible) {
        return {
          intent: 'ORDER_CANCELLATION',
          found: true,
          orderId,
          message: `I'm sorry, but this order cannot be cancelled at this time. ${cancelCheck.reason}. If you still need assistance, a support ticket will be created.`,
          canCancel: false,
          currentStatus: order.status,
        };
      }

      return {
        intent: 'ORDER_CANCELLATION',
        found: true,
        orderId,
        message: "Yes, this order can be cancelled. Would you like me to proceed with the cancellation? Please confirm with 'yes'.",
        canCancel: true,
        requiresConfirmation: true,
      };
    }

    // For other issues, create a support ticket
    const ticketResult = await orderService.createOrderIssueTicket({
      orderId,
      userId: userId || order.userId,
      merchantId: merchantId || order.merchantId,
      issueType,
      description: message,
      priority: this.getPriorityForIssue(issueType),
    });

    return {
      intent: 'ORDER_ISSUE',
      found: true,
      orderId,
      issueType,
      message: `I've noted your concern about this order. ${ticketResult.success ? 'A support ticket has been created and our team will look into it shortly.' : 'Our support team has been notified.'}`,
      ticketId: ticketResult.ticketId,
      currentStatus: order.status,
    };
  }

  /**
   * Classify the type of issue from message
   */
  classifyIssue(message) {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('cancel')) return 'cancellation';
    if (lowerMsg.includes('refund')) return 'refund';
    if (lowerMsg.includes('wrong') || lowerMsg.includes('incorrect')) return 'wrong_item';
    if (lowerMsg.includes('missing')) return 'missing_item';
    if (lowerMsg.includes('cold')) return 'cold_food';
    if (lowerMsg.includes('late') || lowerMsg.includes('delayed')) return 'late_delivery';
    if (lowerMsg.includes('quality') || lowerMsg.includes('bad')) return 'quality_issue';

    return 'general_issue';
  }

  /**
   * Get priority based on issue type
   */
  getPriorityForIssue(issueType) {
    const highPriorityIssues = ['wrong_item', 'missing_item', 'quality_issue'];
    const mediumPriorityIssues = ['cold_food', 'late_delivery', 'refund'];

    if (highPriorityIssues.includes(issueType)) return 'high';
    if (mediumPriorityIssues.includes(issueType)) return 'medium';
    return 'low';
  }

  /**
   * Get available actions based on order status
   */
  getActionsForStatus(status) {
    const lowerStatus = status?.toLowerCase();
    const actions = [];

    if (['pending', 'confirmed'].includes(lowerStatus)) {
      actions.push({ type: 'cancel', label: 'Cancel Order', confirmRequired: true });
    }

    if (['delivered'].includes(lowerStatus)) {
      actions.push({ type: 'rate', label: 'Rate Order' });
      actions.push({ type: 'reorder', label: 'Reorder' });
    }

    actions.push({ type: 'contact_support', label: 'Contact Support' });

    return actions;
  }
}

module.exports = OrderIntentHandler;
