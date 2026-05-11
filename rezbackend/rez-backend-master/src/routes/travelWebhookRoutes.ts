// @ts-nocheck
import { Router } from 'express';
import {
  handleBookingUpdate,
  handlePriceUpdate,
  handleOtaBookingConfirmed,
  handleOtaStayCompleted,
} from '../controllers/travelWebhookController';

const router = Router();

// Webhook endpoints — no auth required (use signature verification instead)
router.post('/booking-update', handleBookingUpdate);
router.post('/price-update', handlePriceUpdate);

// Hotel OTA → REZ: credit REZ coins after hotel booking confirmation
// Called by Hotel OTA's RezWebhookService.sendBookingConfirmed()
router.post('/ota-booking-confirmed', handleOtaBookingConfirmed);

// Hotel OTA → REZ: credit stay-completion bonus after guest checks out
// Called by Hotel OTA's RezWebhookService.sendStayCompleted()
router.post('/ota-stay-completed', handleOtaStayCompleted);

export default router;
