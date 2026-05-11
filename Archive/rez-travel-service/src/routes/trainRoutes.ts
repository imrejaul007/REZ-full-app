// Train Routes
import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { trainService, TrainSearchParams } from '../services/trainService';
import { TravelBooking } from '../models';

const router = Router();

const searchSchema = Joi.object({
  origin: Joi.string().required(),
  destination: Joi.string().required(),
  departureDate: Joi.string().required(),
  quota: Joi.string().valid('GN', 'TQ', 'PY').default('GN'),
});

const bookSchema = Joi.object({
  trainId: Joi.string().required(),
  classCode: Joi.string().required(),
  passengers: Joi.array().items(
    Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      age: Joi.number().min(1).max(120).required(),
      gender: Joi.string().valid('M', 'F', 'O').required(),
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
      berthPreference: Joi.string().optional(),
    })
  ).min(1).required(),
  contactDetails: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
  }).required(),
  companyId: Joi.string().optional(),
});

// Search trains
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { error, value } = searchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const trains = await trainService.searchTrains(value as TrainSearchParams);

    res.json({
      success: true,
      data: {
        trains,
        searchParams: value,
        total: trains.length,
      },
    });
  } catch (error: any) {
    console.error('Train search error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

// Get train details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const train = await trainService.getTrainDetails(req.params.id);
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }

    res.json({ success: true, data: train });
  } catch (error: any) {
    console.error('Get train error:', error);
    res.status(500).json({ success: false, message: 'Failed to get train details' });
  }
});

// Book train
router.post('/book', async (req: Request, res: Response) => {
  try {
    const { error, value } = bookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const result = await trainService.bookTicket({
      ...value,
      userId: (req as any).user?._id || 'guest',
    });

    const train = await trainService.getTrainDetails(value.trainId);
    const cls = train?.classes.find((c) => c.code === value.classCode);

    const booking = new TravelBooking({
      bookingId: result.bookingId,
      userId: (req as any).user?._id || 'guest',
      companyId: value.companyId,
      type: 'train',
      status: 'confirmed',
      passengerDetails: value.passengers.map((p: any) => ({
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
      })),
      contactDetails: value.contactDetails,
      pricing: {
        baseFare: (cls?.price || 0) * value.passengers.length,
        taxes: 0,
        fees: 0,
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
        coachNumber: result.coachNumber,
        seatNumbers: result.seatNumbers,
        message: 'Train ticket booked successfully',
      },
    });
  } catch (error: any) {
    console.error('Train booking error:', error);
    res.status(500).json({ success: false, message: 'Booking failed' });
  }
});

// Get PNR status
router.get('/pnr/:pnr', async (req: Request, res: Response) => {
  try {
    const status = await trainService.getPNRStatus(req.params.pnr);
    res.json({ success: true, data: status });
  } catch (error: any) {
    console.error('PNR status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get PNR status' });
  }
});

// Cancel ticket
router.post('/:bookingId/cancel', async (req: Request, res: Response) => {
  try {
    const result = await trainService.cancelTicket(req.params.bookingId, '');

    await TravelBooking.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      { status: 'cancelled' }
    );

    res.json({
      success: true,
      data: result,
      message: 'Ticket cancelled successfully',
    });
  } catch (error: any) {
    console.error('Cancel ticket error:', error);
    res.status(500).json({ success: false, message: 'Cancellation failed' });
  }
});

export default router;
