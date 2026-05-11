// @ts-nocheck
/**
 * AI Chat Routes
 * Handles the R3 AI Chatbot endpoints: chat, history, and delete.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  sendSuccess,
  sendError,
  sendBadRequest,
  sendUnauthorized,
  sendNotFound,
  sendTooManyRequests,
} from '../utils/response';
import { getClaudeService } from '../services/claudeService';
import { getMenuRagService } from '../services/menuRagService';
import { parse } from '../services/aiResponseParser';
import { buildMenuAssistantPrompt, buildDefaultPrompt } from '../prompts/menuAssistantPrompt';
import { aiRateLimiter } from '../middleware/aiRateLimiter';
import { AIMessage } from '../models/AIMessage';
import { Store } from '../models/Store';
import Menu from '../models/Menu';
import { logger } from '../config/logger';

const router = Router();

/**
 * Auth guard: requires req.userId from JWT middleware.
 */
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = (req as Request & { userId?: string }).userId;
  if (!userId) {
    sendUnauthorized(res, 'Authentication required to use AI chat.');
    return;
  }
  next();
}

/**
 * Verify that order items exist in the live menu.
 * Returns a list of verified items and a list of unrecognized item names.
 */
async function verifyOrderItems(
  items: Array<{ name: string; qty: number }>,
  storeSlug: string,
): Promise<{
  verified: Array<{ name: string; qty: number; unitPrice: number; total: number }>;
  unrecognized: string[];
}> {
  const verified: Array<{ name: string; qty: number; unitPrice: number; total: number }> = [];
  const unrecognized: string[] = [];

  const store = await Store.findOne({ slug: storeSlug }).select('_id').lean().exec();
  if (!store) {
    return { verified, unrecognized: items.map((i) => i.name) };
  }

  const menu = await Menu.findOne({ storeId: store._id, isActive: true }).select('categories').lean().exec();

  if (!menu) {
    return { verified, unrecognized: items.map((i) => i.name) };
  }

  const menuItemMap = new Map<string, number>();
  for (const cat of menu.categories ?? []) {
    for (const item of cat.items ?? []) {
      if (item.name) {
        menuItemMap.set(item.name.toLowerCase().trim(), item.price ?? 0);
      }
    }
  }

  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    const price = menuItemMap.get(key);

    if (price !== undefined) {
      verified.push({
        name: item.name,
        qty: item.qty,
        unitPrice: price,
        total: price * item.qty,
      });
    } else {
      unrecognized.push(item.name);
    }
  }

  return { verified, unrecognized };
}

// ────────────────────────────────────────────────────────────────────────────
// POST /ai/chat
// ────────────────────────────────────────────────────────────────────────────

interface ChatBody {
  conversationId: string;
  message: string;
  storeSlug: string;
  language?: string;
}

router.post(
  '/chat',
  requireAuth,
  aiRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as Request & { userId?: string }).userId!;
    const { conversationId, message, storeSlug, language } = req.body as ChatBody;

    // ── Input validation ──
    if (!conversationId || typeof conversationId !== 'string') {
      sendBadRequest(res, 'conversationId is required.');
      return;
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      sendBadRequest(res, 'message is required and must be non-empty.');
      return;
    }
    if (!storeSlug || typeof storeSlug !== 'string') {
      sendBadRequest(res, 'storeSlug is required.');
      return;
    }
    if (message.trim().length > 2000) {
      sendBadRequest(res, 'Message exceeds the maximum length of 2000 characters.');
      return;
    }

    // ── Fetch or create conversation document ──
    const conversation = await AIMessage.upsertConversation(conversationId, storeSlug, userId);
    const historyMessages = conversation.messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // ── Build RAG context ──
    const menuRagService = getMenuRagService();
    const menuContext = await menuRagService.buildContext(storeSlug);

    // ── Select system prompt ──
    const store = await Store.findOne({ slug: storeSlug }).select('name storeType').lean().exec();

    const systemPrompt = store?.name
      ? buildMenuAssistantPrompt({ storeName: store.name, language: language ?? 'English', menuContext })
      : buildDefaultPrompt();

    // ── Call Claude ──
    const claudeService = getClaudeService();
    const assistantText = await claudeService.chat({
      systemPrompt,
      conversationHistory: historyMessages,
      newMessage: message.trim(),
    });

    // ── Parse response ──
    const parsed = parse(assistantText);
    let verifiedItems: Array<{ name: string; qty: number; unitPrice: number; total: number }> | undefined;
    let unrecognizedItems: string[] | undefined;

    // ── Verify order items against live menu ──
    if (parsed.type === 'order' && parsed.items && parsed.items.length > 0) {
      const { verified, unrecognized } = await verifyOrderItems(parsed.items, storeSlug);
      verifiedItems = verified;
      unrecognizedItems = unrecognized;

      if (unrecognized.length > 0 && verified.length === 0) {
        // None of the order items matched the menu
        logger.warn('[aiRoutes] No order items matched menu', {
          conversationId,
          storeSlug,
          unrecognized,
        });
      }
    }

    // ── Save messages to conversation document ──
    try {
      await AIMessage.findByIdAndUpdate(conversation._id, {
        $push: {
          messages: {
            $each: [
              {
                role: 'user',
                content: message.trim(),
                type: 'text',
                createdAt: new Date(),
              },
              {
                role: 'assistant',
                content: assistantText,
                type: parsed.type,
                metadata: {
                  verifiedItems,
                  unrecognizedItems,
                  reservationParams: parsed.reservationParams,
                },
                createdAt: new Date(),
              },
            ],
          },
        },
        $set: { lastMessage: message.trim() },
      });
    } catch (err) {
      // Non-fatal: log and continue — chat response was already generated
      logger.error('[aiRoutes] Failed to persist conversation', {
        conversationId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // ── Return structured response ──
    sendSuccess(
      res,
      {
        response: parsed.content,
        type: parsed.type,
        items: verifiedItems,
        unrecognizedItems,
        reservationParams: parsed.reservationParams,
        conversationId,
      },
      'AI response generated',
      200,
    );
  }),
);

// ────────────────────────────────────────────────────────────────────────────
// GET /ai/history/:conversationId
// ────────────────────────────────────────────────────────────────────────────

router.get(
  '/history/:conversationId',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as Request & { userId?: string }).userId!;
    const { conversationId } = req.params;

    if (!conversationId) {
      sendBadRequest(res, 'conversationId is required.');
      return;
    }

    const conversation = await AIMessage.findOne({ conversationId }).lean().exec();

    if (!conversation) {
      sendNotFound(res, 'Conversation not found.');
      return;
    }

    // Enforce customerId ownership
    if (conversation.customerId && conversation.customerId !== userId) {
      sendUnauthorized(res, 'You do not have access to this conversation.');
      return;
    }

    sendSuccess(
      res,
      { conversationId: conversation.conversationId, messages: conversation.messages },
      'Conversation retrieved',
    );
  }),
);

// ────────────────────────────────────────────────────────────────────────────
// DELETE /ai/history/:conversationId
// ────────────────────────────────────────────────────────────────────────────

router.delete(
  '/history/:conversationId',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as Request & { userId?: string }).userId!;
    const { conversationId } = req.params;

    if (!conversationId) {
      sendBadRequest(res, 'conversationId is required.');
      return;
    }

    const conversation = await AIMessage.findOne({ conversationId }).lean().exec();

    if (!conversation) {
      sendNotFound(res, 'Conversation not found.');
      return;
    }

    // Enforce customerId ownership
    if (conversation.customerId && conversation.customerId !== userId) {
      sendUnauthorized(res, 'You do not have access to delete this conversation.');
      return;
    }

    await AIMessage.deleteOne({ conversationId }).exec();
    sendSuccess(res, { conversationId }, 'Conversation deleted');
  }),
);

export default router;
