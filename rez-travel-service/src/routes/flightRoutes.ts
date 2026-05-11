// Flight Routes
import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { flightService, FlightSearchParams } from '../services/flightService';
import { TravelBooking } from '../models';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Validation schemas
const searchSchema = Joi.object({
  origin: Joi.string().required(),
  destination: Joi.string().required(),
  departureDate: Joi.string().required(),
  returnDate: Joi.string().optional(),
  passengers: Joi.number().min(1).max(9).default(1),
  class: Joi.string().valid('economy', 'business', 'first').default('economy'),
});

const bookSchema = Joi.object({
  flightId: Joi.string().required(),
  passengers: Joi.array().items(
    Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
      dateOfBirth: Joi.string().optional(),
      type: Joi.string().valid('adult', 'child', 'infant').default('adult'),
    })
  ).min(1).required(),
  contactDetails: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
  }).required(),
  companyId: Joi.string().optional(),
});

// Search flights
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { error, value } = searchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const flights = await flightService.searchFlights(value as FlightSearchParams);

    res.json({
      success: true,
      data: {
        flights,
        searchParams: value,
        total: flights.length,
      },
    });
  } catch (error: any) {
    console.error('Flight search error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

// Get flight details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const flight = await flightService.getFlightDetails(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found' });
    }

    res.json({ success: true, data: flight });
  } catch (error: any) {
    console.error('Get flight error:', error);
    res.status(500).json({ success: false, message: 'Failed to get flight details' });
  }
});

// Book flight
router.post('/book', async (req: Request, res: Response) => {
  try {
    const { error, value } = bookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const result = await flightService.bookFlight({
      ...value,
      userId: (req as any).user?._id || 'guest',
    });

    // Save booking to database
    const flight = await flightService.getFlightDetails(value.flightId);
    const booking = new TravelBooking({
      bookingId: result.bookingId,
      userId: (req as any).user?._id || 'guest',
      companyId: value.companyId,
      type: 'flight',
      status: 'confirmed',
      passengerDetails: value.passengers,
      contactDetails: value.contactDetails,
      pricing: {
        baseFare: (flight?.price.base || 0) * value.passengers.length,
        taxes: (flight?.price.taxes || 0) * value.passengers.length,
        fees: (flight?.price.fees || 0) * value.passengers.length,
        discount: 0,
        total: result.total,
      },
      bookingReference: result.pnr,
    });
    await booking.save();

    res.status(201).json({
      success: true,
      data: {
        bookingId: result.bookingId,
        pnr: result.pnr,
        status: result.status,
        total: result.total,
        message: 'Flight booked successfully',
      },
    });
  } catch (error: any) {
    console.error('Flight booking error:', error);
    res.status(500).json({ success: false, message: 'Booking failed' });
  }
});

// Get PNR status
router.get('/pnr/:pnr', async (req: Request, res: Response) => {
  try {
    const status = await flightService.getPNRStatus(req.params.pnr);
    res.json({ success: true, data: status });
  } catch (error: any) {
    console.error('PNR status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get PNR status' });
  }
});

// Cancel booking
router.post('/:bookingId/cancel', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const result = await flightService.cancelBooking(req.params.bookingId, reason);

    // Update booking in database
    await TravelBooking.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      { status: 'cancelled' }
    );

    res.json({
      success: true,
      data: result,
      message: 'Booking cancelled successfully',
    });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: 'Cancellation failed' });
  }
});

// Get fare rules
router.get('/:id/rules', async (req: Request, res: Response) => {
  try {
    const rules = await flightService.getFareRules(req.params.id);
    res.json({ success: true, data: rules });
  } catch (error: any) {
    console.error('Fare rules error:', error);
    res.status(500).json({ success: false, message: 'Failed to get fare rules' });
  }
});

export default router;
