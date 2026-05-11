// Cab Routes
import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { cabService } from '../services/cabService';
import { TravelBooking } from '../models';

const router = Router();

const searchSchema = Joi.object({
  pickupCity: Joi.string().required(),
  dropCity: Joi.string().optional(),
  pickupLocation: Joi.string().required(),
  dropLocation: Joi.string().optional(),
  tripType: Joi.string().valid('local', 'outstation', 'airport').required(),
  pickupDate: Joi.string().required(),
  pickupTime: Joi.string().required(),
  returnDate: Joi.string().optional(),
  passengers: Joi.number().min(1).max(6).default(1),
});

const bookSchema = Joi.object({
  quoteId: Joi.string().required(),
  vehicleType: Joi.string().valid('mini', 'sedan', 'suv', 'auto', 'bike').required(),
  pickup: Joi.object({
    address: Joi.string().required(),
    city: Joi.string().required(),
    date: Joi.string().required(),
    time: Joi.string().required(),
  }).required(),
  drop: Joi.object({
    address: Joi.string().required(),
    city: Joi.string().required(),
  }).optional(),
  tripType: Joi.string().valid('local', 'outstation', 'airport').required(),
  returnDate: Joi.string().optional(),
  passengerDetails: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
  }).required(),
  companyId: Joi.string().optional(),
});

// Get cab quotes
router.get('/quotes', async (req: Request, res: Response) => {
  try {
    const { error, value } = searchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const quotes = await cabService.getQuotes(value);

    res.json({
      success: true,
      data: {
        quotes,
        searchParams: value,
        total: quotes.length,
      },
    });
  } catch (error: any) {
    console.error('Cab search error:', error);
    res.status(500).json({ success: false, message: 'Failed to get cab quotes' });
  }
});

// Get outstation cabs
router.get('/outstation', async (req: Request, res: Response) => {
  try {
    const { fromCity, toCity, date, returnDate, passengers } = req.query;
    const quotes = await cabService.getOutstationQuotes({
      fromCity: fromCity as string,
      toCity: toCity as string,
      date: date as string,
      returnDate: returnDate as string,
      passengers: parseInt(passengers as string) || 1,
    });

    res.json({
      success: true,
      data: {
        quotes,
        total: quotes.length,
      },
    });
  } catch (error: any) {
    console.error('Outstation cab error:', error);
    res.status(500).json({ success: false, message: 'Failed to get outstation cabs' });
  }
});

// Get airport cabs
router.get('/airport', async (req: Request, res: Response) => {
  try {
    const { airportCity, tripType, date, time } = req.query;
    const quotes = await cabService.getAirportQuotes({
      airportCity: airportCity as string,
      tripType: tripType as 'pickup' | 'drop',
      date: date as string,
      time: time as string,
    });

    res.json({
      success: true,
      data: {
        quotes,
        total: quotes.length,
      },
    });
  } catch (error: any) {
    console.error('Airport cab error:', error);
    res.status(500).json({ success: false, message: 'Failed to get airport cabs' });
  }
});

// Book cab
router.post('/book', async (req: Request, res: Response) => {
  try {
    const { error, value } = bookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const result = await cabService.bookCab({
      ...value,
      userId: (req as any).user?._id || 'guest',
    });

    const booking = new TravelBooking({
      bookingId: result.bookingId,
      userId: (req as any).user?._id || 'guest',
      companyId: value.companyId,
      type: 'cab',
      status: 'confirmed',
      passengerDetails: [
        {
          firstName: value.passengerDetails.firstName,
          lastName: value.passengerDetails.lastName,
          email: value.passengerDetails.email,
          phone: value.passengerDetails.phone,
        },
      ],
      contactDetails: {
        email: value.passengerDetails.email,
        phone: value.passengerDetails.phone,
      },
      pricing: {
        baseFare: result.estimatedPrice,
        taxes: 0,
        fees: 0,
        discount: 0,
        total: result.estimatedPrice,
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
        pickupTime: result.pickupTime,
        vehicleType: result.vehicleType,
        estimatedPrice: result.estimatedPrice,
        otp: result.otp,
        message: 'Cab booked successfully',
      },
    });
  } catch (error: any) {
    console.error('Cab booking error:', error);
    res.status(500).json({ success: false, message: 'Booking failed' });
  }
});

// Track cab
router.get('/track/:bookingId', async (req: Request, res: Response) => {
  try {
    const tracking = await cabService.trackCab(req.params.bookingId);
    res.json({ success: true, data: tracking });
  } catch (error: any) {
    console.error('Track cab error:', error);
    res.status(500).json({ success: false, message: 'Failed to track cab' });
  }
});

// Get driver details
router.get('/driver/:bookingId', async (req: Request, res: Response) => {
  try {
    const driver = await cabService.getDriverDetails(req.params.bookingId);
    res.json({ success: true, data: driver });
  } catch (error: any) {
    console.error('Get driver error:', error);
    res.status(500).json({ success: false, message: 'Failed to get driver details' });
  }
});

// Cancel booking
router.post('/:bookingId/cancel', async (req: Request, res: Response) => {
  try {
    const result = await cabService.cancelBooking(req.params.bookingId);

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
