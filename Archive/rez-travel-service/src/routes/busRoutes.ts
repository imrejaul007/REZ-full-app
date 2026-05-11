// Bus Routes
import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { busService } from '../services/busService';
import { TravelBooking } from '../models';

const router = Router();

const searchSchema = Joi.object({
  origin: Joi.string().required(),
  destination: Joi.string().required(),
  departureDate: Joi.string().required(),
  passengers: Joi.number().min(1).max(6).default(1),
});

const bookSchema = Joi.object({
  busId: Joi.string().required(),
  passengers: Joi.array().items(
    Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      age: Joi.number().min(5).max(100).required(),
      gender: Joi.string().valid('M', 'F', 'O').required(),
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
      seatNumber: Joi.string().required(),
    })
  ).min(1).required(),
  boardingPoint: Joi.string().required(),
  droppingPoint: Joi.string().required(),
  contactDetails: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
  }).required(),
  companyId: Joi.string().optional(),
});

// Search buses
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { error, value } = searchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const buses = await busService.searchBuses(value);

    res.json({
      success: true,
      data: {
        buses,
        searchParams: value,
        total: buses.length,
      },
    });
  } catch (error: any) {
    console.error('Bus search error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

// Get bus details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const bus = await busService.getBusDetails(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    res.json({ success: true, data: bus });
  } catch (error: any) {
    console.error('Get bus error:', error);
    res.status(500).json({ success: false, message: 'Failed to get bus details' });
  }
});

// Get seat layout
router.get('/:id/seats', async (req: Request, res: Response) => {
  try {
    const layout = await busService.getSeatLayout(req.params.id);
    res.json({ success: true, data: layout });
  } catch (error: any) {
    console.error('Get seats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get seat layout' });
  }
});

// Book bus
router.post('/book', async (req: Request, res: Response) => {
  try {
    const { error, value } = bookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const result = await busService.bookBus({
      ...value,
      userId: (req as any).user?._id || 'guest',
    });

    const bus = await busService.getBusDetails(value.busId);

    const booking = new TravelBooking({
      bookingId: result.bookingId,
      userId: (req as any).user?._id || 'guest',
      companyId: value.companyId,
      type: 'bus',
      status: 'confirmed',
      passengerDetails: value.passengers.map((p: any) => ({
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
      })),
      contactDetails: value.contactDetails,
      pricing: {
        baseFare: (bus?.price.base || 0) * value.passengers.length,
        taxes: (bus?.price.taxes || 0) * value.passengers.length,
        fees: 0,
        discount: 0,
        total: result.total,
      },
      bookingReference: result.confirmationNumber,
    });
    await booking.save();

    res.status(201).json({
      success: true,
      data: {
        bookingId: result.bookingId,
        confirmationNumber: result.confirmationNumber,
        status: result.status,
        total: result.total,
        seatNumbers: result.seatNumbers,
        boardingPoint: result.boardingPoint,
        droppingPoint: result.droppingPoint,
        message: 'Bus booked successfully',
      },
    });
  } catch (error: any) {
    console.error('Bus booking error:', error);
    res.status(500).json({ success: false, message: 'Booking failed' });
  }
});

// Get booking status
router.get('/booking/:bookingId', async (req: Request, res: Response) => {
  try {
    const status = await busService.getBookingStatus(req.params.bookingId);
    res.json({ success: true, data: status });
  } catch (error: any) {
    console.error('Booking status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get booking status' });
  }
});

// Cancel booking
router.post('/:bookingId/cancel', async (req: Request, res: Response) => {
  try {
    const result = await busService.cancelBooking(req.params.bookingId);

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

export default router;
