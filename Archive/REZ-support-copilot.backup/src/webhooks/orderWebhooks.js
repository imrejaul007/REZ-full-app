const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Webhook secret for verification
const WEBHOOK_SECRET = process.env.SUPPORT_COPILOT_WEBHOOK_SECRET || 'your-webhook-secret';

// Support ticket schema (create if not exists)
const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true },
  type: String, // 'order_issue', 'complaint', 'refund_request', 'general'
  status: { type: String, default: 'open' },
  priority: { type: String, default: 'medium' },
  orderId: String,
  userId: String,
  merchantId: String,
  subject: String,
  description: String,
  messages: [{
    sender: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  assignedTo: String,
  resolvedAt: Date,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);

// Webhook verification middleware
const verifyWebhook = (req, res, next) => {
  const signature = req.headers['x-webhook-signature'];

  if (signature !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
};

// Order created webhook
router.post('/order/created', verifyWebhook, async (req, res) => {
  const { orderId, userId, merchantId, items, total } = req.body;

  try {
    // Log the event
    console.log(`Order created webhook: ${orderId}`);

    // Auto-create tracking ticket
    const ticket = new Ticket({
      ticketId: `ORD-${orderId}`,
      type: 'order_tracking',
      status: 'open',
      priority: 'low',
      orderId,
      userId,
      merchantId,
      subject: `Order #${orderId} placed`,
      description: `New order placed for Rs.${total}. ${items.length} items.`,
      metadata: { order: req.body }
    });

    await ticket.save();

    res.json({ success: true, ticketId: ticket.ticketId });
  } catch (error) {
    console.error('Order webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Order status changed webhook
router.post('/order/status', verifyWebhook, async (req, res) => {
  const { orderId, oldStatus, newStatus, userId } = req.body;

  try {
    console.log(`Order status changed: ${orderId} ${oldStatus} -> ${newStatus}`);

    // If order cancelled or delivered, update related tickets
    if (newStatus === 'delivered') {
      await Ticket.updateMany(
        { orderId, type: 'order_issue' },
        { status: 'resolved', resolvedAt: new Date() }
      );
    }

    // If order cancelled, create a ticket if user had issues
    if (newStatus === 'cancelled') {
      const ticket = new Ticket({
        ticketId: `ORD-CANCEL-${orderId}`,
        type: 'order_cancellation',
        status: 'open',
        priority: 'high',
        orderId,
        userId,
        subject: `Order #${orderId} cancelled`,
        description: `Order was cancelled. Checking for refund eligibility.`,
        metadata: { oldStatus, newStatus }
      });

      await ticket.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Status webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Order issue reported webhook
router.post('/order/issue', verifyWebhook, async (req, res) => {
  const { orderId, userId, issueType, description } = req.body;

  try {
    const ticket = new Ticket({
      ticketId: `ISSUE-${Date.now()}`,
      type: 'order_issue',
      status: 'open',
      priority: issueType === 'food_quality' ? 'high' : 'medium',
      orderId,
      userId,
      subject: `Issue with Order #${orderId}`,
      description,
      messages: [{
        sender: 'system',
        content: `Issue reported: ${issueType}`,
        timestamp: new Date()
      }],
      metadata: { issueType, reportedAt: new Date() }
    });

    await ticket.save();

    // TODO: Send notification to merchant/admin

    res.json({ success: true, ticketId: ticket.ticketId });
  } catch (error) {
    console.error('Issue webhook error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Refund requested webhook
router.post('/order/refund', verifyWebhook, async (req, res) => {
  const { orderId, userId, amount, reason } = req.body;

  try {
    const ticket = new Ticket({
      ticketId: `REFUND-${Date.now()}`,
      type: 'refund_request',
      status: 'pending_review',
      priority: 'high',
      orderId,
      userId,
      subject: `Refund request for Order #${orderId}`,
      description: `Requested refund: Rs.${amount}. Reason: ${reason}`,
      metadata: { refundAmount: amount, reason, requestedAt: new Date() }
    });

    await ticket.save();

    res.json({ success: true, ticketId: ticket.ticketId });
  } catch (error) {
    console.error('Refund webhook error:', error);
    res.status(500).json({ error: 'Failed to process refund request' });
  }
});

module.exports = router;
