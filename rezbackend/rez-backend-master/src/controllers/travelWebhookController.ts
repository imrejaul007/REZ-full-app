/**
 * Travel Webhook Controller
 *
 * Stubbed endpoints for future travel partner integrations.
 * Partners can push booking updates, PNR assignments, and price changes.
 */

import { Request, Response } from 'express';
import { ServiceBooking } from '../models/ServiceBooking';
import { OtaBooking } from '../models/OtaBooking';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../config/logger';
import * as crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler';
import { awardCoins } from '../services/coinService';
import { triggerReviewPrompt } from './hotelReviewController';

/**
 * Verify HMAC-SHA256 webhook signature from travel partners.
 *
 * E6: `body` MUST be the raw byte string captured by the productionMiddleware
 *   verify hook (req.rawBody) — NOT JSON.stringify(req.body). Express
 *   re-serialization changes whitespace/key-order and breaks HMAC equality.
 *   Length-check signature buffers before timingSafeEqual to avoid the
 *   length-mismatch throw being the only validation.
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.TRAVEL_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('[TRAVEL WEBHOOK] TRAVEL_WEBHOOK_SECRET not configured');
    return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length) return false;
  try {
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Pull the raw body captured by the global express.json verify hook.
 * Falls back to JSON.stringify for backward-compat until the verify hook
 * has propagated to all environments, but always logs when fallback is used.
 */
function getRawBody(req: Request): string {
  const raw = (req as any).rawBody as string | undefined;
  if (raw && raw.length > 0) return raw;
  logger.warn(
    '[TRAVEL WEBHOOK] rawBody missing — falling back to JSON.stringify (HMAC may fail). Upgrade deploy to include E6 productionMiddleware.',
  );
  return JSON.stringify(req.body);
}

/**
 * POST /api/travel-webhooks/booking-update
 *
 * Receives booking status updates from travel partners.
 * Expected payload:
 * {
 *   bookingNumber: string,
 *   externalReference?: string,
 *   pnr?: string,
 *   status?: 'confirmed' | 'cancelled',
 *   eTicketUrl?: string,
 *   signature: string  // HMAC signature for verification
 * }
 */
export const handleBookingUpdate = asyncHandler(async (req: Request, res: Response) => {
  const { bookingNumber, externalReference, pnr, status, eTicketUrl, signature } = req.body;

  // Verify webhook signature against the RAW request bytes (req.rawBody).
  const sig = (req.headers['x-webhook-signature'] as string) || signature;
  if (!sig || !verifyWebhookSignature(getRawBody(req), sig)) {
    logger.warn('[TRAVEL WEBHOOK] Invalid or missing signature for booking update');
    return sendError(res, 'Invalid webhook signature', 401);
  }
  logger.info('[TRAVEL WEBHOOK] Booking update received:', {
    bookingNumber,
    externalReference,
    pnr,
    status,
    hasETicket: !!eTicketUrl,
  });

  if (!bookingNumber && !externalReference) {
    return sendError(res, 'bookingNumber or externalReference is required', 400);
  }

  // Find booking by booking number or external reference
  const query: any = {};
  if (bookingNumber) query.bookingNumber = bookingNumber;
  if (externalReference) query.externalReference = externalReference;

  const booking = await ServiceBooking.findOne(query);
  if (!booking) {
    logger.warn('[TRAVEL WEBHOOK] Booking not found:', query);
    return sendError(res, 'Booking not found', 404);
  }

  // Apply updates atomically — idempotency guard prevents double-processing on duplicate delivery
  const updateFields: Record<string, any> = {};
  if (pnr) updateFields.pnr = pnr;
  if (eTicketUrl) updateFields.eTicketUrl = eTicketUrl;
  if (externalReference && !booking.externalReference) updateFields.externalReference = externalReference;

  let statusFilter: Record<string, any> = {};
  if (status === 'confirmed') {
    statusFilter = { status: 'pending' }; // only advance if still pending
    updateFields.status = 'confirmed';
    updateFields.confirmedAt = new Date();
  } else if (status === 'cancelled') {
    statusFilter = { status: { $ne: 'cancelled' } }; // only cancel if not already
    updateFields.status = 'cancelled';
    updateFields.cancelledAt = new Date();
    updateFields.cancellationReason = 'Cancelled by travel partner';
  }

  await ServiceBooking.findOneAndUpdate({ _id: booking._id, ...statusFilter }, { $set: updateFields });

  logger.info('[TRAVEL WEBHOOK] Booking updated successfully:', booking.bookingNumber);
  sendSuccess(res, { bookingNumber: booking.bookingNumber, updated: true });
});

/**
 * POST /api/travel-webhooks/ota-booking-confirmed
 *
 * Receives booking_confirmed events from Hotel OTA (StayOwn).
 * Credits REZ coins to the user's REZ wallet.
 *
 * Headers:
 *   X-HMAC-Signature — HMAC-SHA256 of request body using REZ_OTA_WEBHOOK_SECRET
 *
 * Payload (sent by Hotel OTA RezWebhookService):
 * {
 *   event: 'booking_confirmed',
 *   booking_id: string,
 *   rez_user_id: string,
 *   booking_value_paise: number,
 *   channel_source: string,
 *   rez_coin_to_credit_paise: number,
 *   timestamp: string
 * }
 */
export const handleOtaBookingConfirmed = asyncHandler(async (req: Request, res: Response) => {
  // Verify HMAC-SHA256 signature from Hotel OTA
  const secret = process.env.REZ_OTA_WEBHOOK_SECRET || process.env.REZ_WEBHOOK_SECRET || '';
  const signature = (req.headers['x-hmac-signature'] as string) || '';

  if (!secret) {
    logger.warn('[OTA WEBHOOK] REZ_OTA_WEBHOOK_SECRET not configured — rejecting');
    return sendError(res, 'Webhook secret not configured', 500);
  }
  if (!signature) {
    return sendError(res, 'Missing X-HMAC-Signature header', 401);
  }

  // E6: Verify HMAC against the raw request bytes, not re-serialized JSON.
  const bodyStr = getRawBody(req);
  const expected = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
  // E6: hex-decode before compare + length-check so length-mismatch isn't
  // a thrown exception that's caught below — returns false cleanly.
  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length) {
    logger.warn('[OTA WEBHOOK] Signature length mismatch');
    return sendError(res, 'Invalid webhook signature', 401);
  }
  try {
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
      logger.warn('[OTA WEBHOOK] Signature mismatch');
      return sendError(res, 'Invalid webhook signature', 401);
    }
  } catch {
    return sendError(res, 'Invalid webhook signature', 401);
  }

  const { event, booking_id, rez_user_id, booking_value_paise, channel_source, rez_coin_to_credit_paise } = req.body;

  if (event !== 'booking_confirmed') {
    logger.warn('[OTA WEBHOOK] Unexpected event type:', event);
    return sendError(res, `Unsupported event: ${event}`, 422);
  }
  if (!booking_id || !rez_user_id) {
    return sendError(res, 'booking_id and rez_user_id are required', 400);
  }

  const coinsToCreditPaise = Number(rez_coin_to_credit_paise) || 0;
  if (coinsToCreditPaise <= 0) {
    logger.info('[OTA WEBHOOK] booking_confirmed with 0 coins — ack without crediting', { booking_id });
    return sendSuccess(res, { booking_id, credited: 0 });
  }

  // Convert paise → REZ coin units (1 REZ coin = ₹1 = 100 paise by default)
  const rezCoinToRupeeRate = parseFloat(process.env.REZ_COIN_TO_RUPEE_RATE || '1');
  const coinAmount = Math.round(coinsToCreditPaise / (rezCoinToRupeeRate * 100));

  // CD-XS-02: Create OtaBooking document BEFORE awardCoins to avoid dangling reference.
  // Uses upsert for idempotency — webhook retry on same booking_id is safe.
  const otaBookingRecord = await OtaBooking.findOneAndUpdate(
    { otaBookingId: booking_id },
    {
      $setOnCreate: {
        otaBookingId: booking_id,
        userId: rez_user_id,
        amountPaise: Number(booking_value_paise) || 0,
        channelSource: channel_source || 'unknown',
        status: 'confirmed',
        // hotelId and checkIn/checkOut are partial — not sent by the OTA webhook.
        // Consumers that need them should enrich via the OTA's booking detail API.
      },
    },
    { upsert: true, new: true, lean: true },
  );

  logger.info('[OTA WEBHOOK] OtaBooking record upserted', {
    otaBookingId: booking_id,
    mongoId: otaBookingRecord?._id,
    userId: rez_user_id,
    amountPaise: Number(booking_value_paise) || 0,
  });

  try {
    const result = await awardCoins(
      rez_user_id,
      coinAmount,
      'hotel_booking',
      `REZ coins earned on hotel booking ${booking_id}`,
      {
        referenceId: String(otaBookingRecord?._id),
        referenceModel: 'OtaBooking',
        bookingId: booking_id,
        coinType: 'rez',
      },
      'travel-experiences', // category
      'rez',
    );

    logger.info('[OTA WEBHOOK] REZ coins credited for hotel booking', {
      booking_id,
      rez_user_id,
      coinAmount,
      txnId: result.transactionId,
    });

    return sendSuccess(res, { booking_id, credited: coinAmount, transaction_id: result.transactionId });
  } catch (err: any) {
    // Idempotency: duplicate referenceId throws — treat as already processed
    if (err?.message?.includes('duplicate') || err?.code === 11000) {
      logger.info('[OTA WEBHOOK] Duplicate booking_confirmed ignored (already processed)', { booking_id });
      return sendSuccess(res, { booking_id, credited: coinAmount, duplicate: true });
    }
    logger.error('[OTA WEBHOOK] Failed to credit REZ coins:', err?.message, { booking_id, rez_user_id });
    return sendError(res, 'Failed to credit coins', 500);
  }
});

/**
 * POST /api/travel-webhooks/ota-stay-completed
 *
 * Receives stay_completed events from Hotel OTA (StayOwn).
 * Credits a stay-completion bonus in REZ coins to the user's REZ wallet.
 * The completion bonus is separate from the booking confirmation bonus and is
 * calculated as a percentage of the original booking value (default 20%).
 *
 * Headers:
 *   X-HMAC-Signature — HMAC-SHA256 of request body using REZ_OTA_WEBHOOK_SECRET
 *
 * Payload (sent by Hotel OTA RezWebhookService):
 * {
 *   event: 'stay_completed',
 *   booking_id: string,
 *   rez_user_id: string,
 *   booking_value_paise: number,
 *   stay_completion_bonus_paise?: number,  // explicit bonus amount; if absent, derived from booking_value_paise
 *   timestamp: string
 * }
 */
export const handleOtaStayCompleted = asyncHandler(async (req: Request, res: Response) => {
  // Verify HMAC-SHA256 signature from Hotel OTA (same secret as booking_confirmed)
  const secret = process.env.REZ_OTA_WEBHOOK_SECRET || process.env.REZ_WEBHOOK_SECRET || '';
  const signature = (req.headers['x-hmac-signature'] as string) || '';

  if (!secret) {
    logger.warn('[OTA WEBHOOK] REZ_OTA_WEBHOOK_SECRET not configured — rejecting stay_completed');
    return sendError(res, 'Webhook secret not configured', 500);
  }
  if (!signature) {
    return sendError(res, 'Missing X-HMAC-Signature header', 401);
  }

  // E6: Verify HMAC against the raw request bytes, not re-serialized JSON.
  const bodyStr = getRawBody(req);
  const expected = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
  try {
    // E6: length-check + hex-decode (same pattern as handleOtaBookingConfirmed).
    const sigBuf2 = Buffer.from(signature, 'hex');
    const expBuf2 = Buffer.from(expected, 'hex');
    if (sigBuf2.length !== expBuf2.length) {
      logger.warn('[OTA WEBHOOK] Signature length mismatch for stay_completed');
      return sendError(res, 'Invalid webhook signature', 401);
    }
    if (!crypto.timingSafeEqual(sigBuf2, expBuf2)) {
      logger.warn('[OTA WEBHOOK] Signature mismatch for stay_completed');
      return sendError(res, 'Invalid webhook signature', 401);
    }
  } catch {
    return sendError(res, 'Invalid webhook signature', 401);
  }

  const { event, booking_id, rez_user_id, booking_value_paise, stay_completion_bonus_paise } = req.body;

  if (event !== 'stay_completed') {
    logger.warn('[OTA WEBHOOK] Unexpected event type for stay_completed handler:', event);
    return sendError(res, `Unsupported event: ${event}`, 422);
  }
  if (!booking_id || !rez_user_id) {
    return sendError(res, 'booking_id and rez_user_id are required', 400);
  }

  // Look up the OtaBooking to get the hotelId for the review prompt trigger
  // Uses otaBookingId (the OTA's string booking_id) not MongoDB _id (CD-XS-02 root cause)
  const otaBooking = await OtaBooking.findOne({ otaBookingId: booking_id }).select('hotelId userId status').lean();
  if (!otaBooking) {
    logger.warn('[OTA WEBHOOK] OtaBooking not found for stay_completed', { booking_id });
    return sendError(res, 'Booking not found', 404);
  }
  const hotelId = String(otaBooking.hotelId);

  // Determine the bonus amount in paise:
  // - Use explicit stay_completion_bonus_paise if provided by the OTA
  // - Otherwise derive it as REZ_STAY_COMPLETION_BONUS_PCT% of booking_value_paise (default 20%)
  const completionBonusPct = parseFloat(process.env.REZ_STAY_COMPLETION_BONUS_PCT || '20') / 100;
  const bookingValuePaise = Number(booking_value_paise) || 0;
  const bonusPaise =
    Number(stay_completion_bonus_paise) > 0
      ? Number(stay_completion_bonus_paise)
      : Math.round(bookingValuePaise * completionBonusPct);

  if (bonusPaise <= 0) {
    logger.info('[OTA WEBHOOK] stay_completed with 0 bonus paise — ack without crediting', { booking_id });
    // Still prompt for review even when no coins are credited
    triggerReviewPrompt(rez_user_id, hotelId, booking_id).catch((err) =>
      logger.warn('[OTA WEBHOOK] Review prompt trigger failed', { booking_id, error: err?.message }),
    );
    return sendSuccess(res, { booking_id, credited: 0 });
  }

  // Convert paise → REZ coin units (1 REZ coin = ₹1 = 100 paise by default)
  const rezCoinToRupeeRate = parseFloat(process.env.REZ_COIN_TO_RUPEE_RATE || '1');
  const coinAmount = Math.round(bonusPaise / (rezCoinToRupeeRate * 100));

  try {
    const result = await awardCoins(
      rez_user_id,
      coinAmount,
      'hotel_stay_completed',
      `REZ coins earned on hotel stay completion for booking ${booking_id}`,
      {
        referenceId: `ota_stay_completed_${booking_id}`,
        referenceModel: 'OtaBooking',
        bookingId: booking_id,
        coinType: 'rez',
      },
      'travel-experiences', // category
      'rez',
    );

    logger.info('[OTA WEBHOOK] REZ stay-completion bonus credited', {
      booking_id,
      rez_user_id,
      coinAmount,
      txnId: result.transactionId,
    });

    // Fire review prompt in the background — non-blocking, errors logged but not surfaced
    triggerReviewPrompt(rez_user_id, hotelId, booking_id).catch((err) =>
      logger.warn('[OTA WEBHOOK] Review prompt trigger failed', { booking_id, error: err?.message }),
    );

    return sendSuccess(res, { booking_id, credited: coinAmount, transaction_id: result.transactionId });
  } catch (err: any) {
    // Idempotency: duplicate referenceId throws — treat as already processed
    if (err?.message?.includes('duplicate') || err?.code === 11000) {
      logger.info('[OTA WEBHOOK] Duplicate stay_completed ignored (already processed)', { booking_id });
      return sendSuccess(res, { booking_id, credited: coinAmount, duplicate: true });
    }
    logger.error('[OTA WEBHOOK] Failed to credit stay-completion bonus:', err?.message, { booking_id, rez_user_id });
    return sendError(res, 'Failed to credit coins', 500);
  }
});

/**
 * POST /api/travel-webhooks/price-update
 *
 * Receives fare/price changes from travel partners.
 * Expected payload:
 * {
 *   serviceId: string,
 *   newPrice: number,
 *   effectiveFrom?: string,
 *   signature: string
 * }
 */
export const handlePriceUpdate = asyncHandler(async (req: Request, res: Response) => {
  const { serviceId, newPrice, effectiveFrom, signature } = req.body;

  // Verify webhook signature against the RAW request bytes (req.rawBody).
  const sig = (req.headers['x-webhook-signature'] as string) || signature;
  if (!sig || !verifyWebhookSignature(getRawBody(req), sig)) {
    logger.warn('[TRAVEL WEBHOOK] Invalid or missing signature for price update');
    return sendError(res, 'Invalid webhook signature', 401);
  }
  logger.info('[TRAVEL WEBHOOK] Price update received:', {
    serviceId,
    newPrice,
    effectiveFrom,
  });

  if (!serviceId || !newPrice) {
    return sendError(res, 'serviceId and newPrice are required', 400);
  }

  // STUB: Product pricing update not implemented. Will be enabled with partner API integration.
  logger.info('[TRAVEL WEBHOOK] Price update logged (stub) — will implement with partner API');

  sendSuccess(res, { serviceId, newPrice, acknowledged: true });
});
