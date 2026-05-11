import mongoose, { Schema, Document } from 'mongoose';

// Base interface for all travel bookings
export interface ITravelBooking extends Document {
  bookingId: string;
  userId: string;
  companyId?: string;
  type: 'flight' | 'train' | 'bus' | 'cab';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  passengerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }[];
  contactDetails: {
    email: string;
    phone: string;
  };
  pricing: {
    baseFare: number;
    taxes: number;
    fees: number;
    discount: number;
    total: number;
  };
  bookingReference: string;
  createdAt: Date;
  updatedAt: Date;
}

// Flight booking specific
export interface IFlightBooking extends ITravelBooking {
  type: 'flight';
  flightDetails: {
    airline: string;
    airlineCode: string;
    flightNumber: string;
    departure: {
      airport: string;
      airportCode: string;
      city: string;
      terminal?: string;
      date: string;
      time: string;
    };
    arrival: {
      airport: string;
      airportCode: string;
      city: string;
      terminal?: string;
      date: string;
      time: string;
    };
    class: 'economy' | 'business' | 'first';
    baggage: {
      cabin: string;
      checkIn: string;
    };
  };
  pnr?: string;
}

// Train booking specific
export interface ITrainBooking extends ITravelBooking {
  type: 'train';
  trainDetails: {
    trainName: string;
    trainNumber: string;
    class: string;
    quota: 'GN' | 'TQ' | 'PY';
    departure: {
      station: string;
      stationCode: string;
      city: string;
      date: string;
      time: string;
    };
    arrival: {
      station: string;
      stationCode: string;
      city: string;
      date: string;
      time: string;
    };
    duration: string;
    pnr?: string;
  };
}

// Bus booking specific
export interface IBusBooking extends ITravelBooking {
  type: 'bus';
  busDetails: {
    operator: string;
    busType: string;
    departure: {
      busStand: string;
      city: string;
      date: string;
      time: string;
    };
    arrival: {
      busStand: string;
      city: string;
      date: string;
      time: string;
    };
    duration: string;
    boardingPoint?: string;
    droppingPoint?: string;
    seatNumbers: string[];
  };
}

// Cab booking specific
export interface ICabBooking extends ITravelBooking {
  type: 'cab';
  cabDetails: {
    vehicleType: 'sedan' | 'suv' | 'mini' | 'auto' | 'bike';
    operator: string;
    pickup: {
      address: string;
      city: string;
      date: string;
      time: string;
    };
    drop: {
      address: string;
      city: string;
    };
    tripType: 'local' | 'outstation' | 'airport';
    distance?: string;
    estimatedTime?: string;
  };
}

// Main TravelBooking Schema
const TravelBookingSchema = new Schema<ITravelBooking>(
  {
    bookingId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, index: true },
    type: {
      type: String,
      enum: ['flight', 'train', 'bus', 'cab'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    passengerDetails: [
      {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
      },
    ],
    contactDetails: {
      email: String,
      phone: String,
    },
    pricing: {
      baseFare: Number,
      taxes: Number,
      fees: Number,
      discount: Number,
      total: Number,
    },
    bookingReference: { type: String, required: true },
  },
  { timestamps: true }
);

// Indexes
TravelBookingSchema.index({ bookingId: 1 });
TravelBookingSchema.index({ userId: 1, createdAt: -1 });
TravelBookingSchema.index({ companyId: 1, createdAt: -1 });
TravelBookingSchema.index({ status: 1, type: 1 });

export const TravelBooking = mongoose.model<ITravelBooking>('TravelBooking', TravelBookingSchema);

// Travel Itinerary for multi-leg trips
export interface ITravelItinerary extends Document {
  itineraryId: string;
  bookingId: string;
  legs: {
    type: 'flight' | 'train' | 'bus' | 'cab';
    sequence: number;
    departure: any;
    arrival: any;
    bookingReference: string;
    status: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const TravelItinerarySchema = new Schema<ITravelItinerary>({
  itineraryId: { type: String, required: true, unique: true },
  bookingId: { type: String, required: true },
  legs: [
    {
      type: String,
      sequence: Number,
      departure: Schema.Types.Mixed,
      arrival: Schema.Types.Mixed,
      bookingReference: String,
      status: String,
    },
  ],
}, { timestamps: true });

export const TravelItinerary = mongoose.model<ITravelItinerary>('TravelItinerary', TravelItinerarySchema);
