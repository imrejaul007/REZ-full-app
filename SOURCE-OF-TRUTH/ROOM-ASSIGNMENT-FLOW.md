# ROOM ASSIGNMENT FLOW - Complete Documentation

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BOOKING FLOW │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ STEP 1: HOLD │
│ StayOwn (OTA) ──→ Hotel-PMS: POST /v1/bookings/hold │
│ │
│ Response: { │
│   holdId, │
│   bookingRef, │
│   roomTypeId (ROOM TYPE, not physical room), │
│   expiresAt (10 min) │
│ } │
│ │
│ ⚠️ NOTE: At HOLD stage, NO physical room is assigned │
│ Only ROOM TYPE is reserved │
│ │
│ ▼ │
│ │
│ STEP 2: CONFIRM │
│ StayOwn (OTA) ──→ Hotel-PMS: POST /v1/bookings/confirm │
│ │
│ Response: { │
│   bookingId, │
│   confirmationNumber, │
│   status: "confirmed" │
│ } │
│ │
│ ⚠️ NOTE: Still NO physical room assigned │
│ Physical room assigned only at CHECK-IN │
│ │
│ ▼ │
│ │
│ STEP 3: CHECK-IN │
│ Hotel-PMS ──→ Staff assigns physical room (e.g., Room 101) │
│ Hotel-PMS ──→ StayOwn Webhook: POST /api/webhooks/pms/check-in │
│ { │
│   event: "check_in", │
│   bookingId, │
│   roomId: "R101", (PHYSICAL ROOM NOW ASSIGNED) │
│   roomNumber: "101", │
│   roomTypeId, │
│   checkInTime │
│ } │
│ │
│ StayOwn receives room assignment │
│ │
│ ▼ │
│ │
│ STEP 4: ROOM QR GENERATION │
│ StayOwn generates QR with physical room │
│ { │
│   roomId: "R101", │
│   roomNumber: "101", │
│   hotelId, │
│   bookingId │
│ } │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PROBLEM IDENTIFIED

Currently:

| Stage | StayOwn Knows | Hotel-PMS Knows |
|-------|---------------|------------------|
| Hold | roomTypeId | roomTypeId |
| Confirm | bookingId | bookingId, roomTypeId |
| **Check-in** | ❌ roomNumber | ✅ Room 101 |
| **Room QR** | ❌ roomNumber | ✅ Room 101 |

**The gap:** StayOwn doesn't receive room assignment from PMS.

---

## SOLUTION: Webhook + QR Auto-Generation

### Flow After Fix:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CHECK-IN WEBHOOK FLOW │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ 1. Guest arrives at hotel │
│ 2. Staff checks in guest in Hotel-PMS │
│ 3. Staff assigns physical room (Room 101) │
│ │
│ 4. Hotel-PMS sends webhook to StayOwn: │
│ │
│    POST {REZ_STAYOWN_WEBHOOK_URL}/api/webhooks/pms/check-in │
│    { │
│      event: "check_in", │
│      bookingId: "BK123", │
│      roomId: "R101", │
│      roomNumber: "101", │
│      roomType: "Deluxe", │
│      floor: "1", │
│      guestName: "John Doe", │
│      guestEmail: "john@email.com", │
│      checkInTime: "2026-05-08T14:00:00Z" │
│    } │
│ │
│ 5. StayOwn: │
│    a) Updates booking with room assignment │
│    b) Generates Room QR │
│    c) Sends QR to guest via email/WhatsApp │
│    d) Stores roomId for Room Hub access │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## IMPLEMENTATION

### 1. StayOwn Webhook Handler

```typescript
// stayown-service/src/routes/pms-webhooks.ts

interface CheckInWebhook {
  event: 'check_in';
  bookingId: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  floor?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInTime: string;
}

router.post('/webhooks/pms/check-in', async (req, res) => {
  const webhookSecret = req.headers['x-webhook-secret'];

  // Verify signature
  if (webhookSecret !== process.env.PMS_WEBHOOK_SECRET) {
    return res.status(401).json({ success: false, message: 'Invalid webhook' });
  }

  const data: CheckInWebhook = req.body;

  // 1. Update booking with room assignment
  const booking = await Booking.findOneAndUpdate(
    { bookingId: data.bookingId },
    {
      roomId: data.roomId,
      roomNumber: data.roomNumber,
      roomType: data.roomType,
      checkInStatus: 'checked_in',
      checkedInAt: new Date(data.checkInTime),
    }
  );

  // 2. Generate Room QR
  const qrConfig = {
    hotelId: booking.propertyId,
    hotelName: booking.propertyName,
    hotelSlug: booking.propertySlug,
    roomId: data.roomId,
    roomNumber: data.roomNumber,
    bookingId: data.bookingId,
    guestId: booking.guestId,
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    guestPhone: data.guestPhone || booking.guestPhone,
    checkIn: new Date(data.checkInTime),
    checkOut: booking.checkOut,
  };

  const qr = await generateAndNotifyRoomQR(qrConfig);

  // 3. Send notifications
  await sendRoomQRSMS(data.guestPhone, qr.qrUrl);
  await sendRoomQREmail(data.guestEmail, qr);

  // 4. Respond to PMS
  res.json({
    success: true,
    roomQR: {
      qrId: qr._id,
      qrUrl: qr.qrUrl,
      status: 'sent',
    },
  });
});
```

### 2. StayOwn Booking Model Update

```typescript
// stayown-service/src/models/booking.ts

interface BookingDocument {
  bookingId: string;
  propertyId: string;
  propertyName: string;
  propertySlug: string;
  roomTypeId: string;
  roomType?: string;          // Added: Deluxe, Suite, etc.
  roomId?: string;            // Added: Physical room ID from PMS
  roomNumber?: string;        // Added: "101", "202" etc.
  floor?: string;             // Added: "1", "2" etc.
  checkIn: Date;
  checkOut: Date;
  checkInStatus: 'pending' | 'checked_in' | 'checked_out';
  checkedInAt?: Date;
  roomQRId?: string;
  guestDetails: {
    guestId: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
  };
}
```

### 3. StayOwn Pre-Arrival Update

```typescript
// stayown-service/src/routes/pre-arrival.routes.ts

router.get('/booking/:bookingId', async (req, res) => {
  const booking = await Booking.findOne({ bookingId: req.params.bookingId });

  // Check if room is assigned (check-in happened)
  if (booking.roomId && booking.roomId) {
    // Room assigned - guest can use Room Hub
    return res.json({
      success: true,
      data: {
        bookingId: booking.bookingId,
        status: 'checked_in',
        room: {
          roomId: booking.roomId,
          roomNumber: booking.roomNumber,
          roomType: booking.roomType,
        },
        roomHubUrl: `/room-service/${booking.propertyId}/${booking.roomId}`,
        roomQR: booking.roomQRId ? await getRoomQRUrl(booking.roomQRId) : null,
        preferences: booking.preferences,
      },
    });
  }

  // Room not yet assigned (pre-arrival)
  return res.json({
    success: true,
    data: {
      bookingId: booking.bookingId,
      status: 'pre_arrival',
      checkInTime: booking.checkIn,
      roomHubAvailable: false,
      message: 'Room will be assigned at check-in',
    },
  });
});
```

---

## FOR NON-USERS (No App)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NON-APP USER FLOW │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ 1. Guest books via OTA (TravelN/Booking.com/StayOwn web) │
│ 2. Receives confirmation email with booking reference │
│ 3. At hotel, staff assigns Room 101 │
│ 4. Staff sends Room QR via WhatsApp/SMS │
│ │
│ GUEST SCANS QR → Opens Room Hub │
│ │
│ Room Hub URL: https://room.rez.money/{hotelSlug}/{roomNumber} │
│ │
│ OR │
│ │
│ Guest receives link: https://rez.money/room/{bookingId} │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Deep Linking

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DEEP LINK SCHEMES │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ APP USERS (Has StayOwn app): │
│ rez://room/{hotelId}/{roomId} │
│ → Opens Room Hub in app │
│ │
│ WEB USERS (No app): │
│ https://room.rez.money/{hotelSlug}/{roomNumber} │
│ → Opens Room Hub in browser │
│ │
│ FALLBACK: │
│ https://rez.money/room/{bookingId} │
│ → Room Hub with booking details │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

- [ ] Add `roomId`, `roomNumber`, `floor` to StayOwn Booking model
- [ ] Create webhook handler for PMS check-in events
- [ ] Add HMAC signature verification for webhooks
- [ ] Auto-generate Room QR on check-in webhook
- [ ] Send QR via SMS/WhatsApp/Email
- [ ] Update Pre-Arrival API to return room details when assigned
- [ ] Update Room Hub to show room number when available
- [ ] Test webhook delivery from Hotel-PMS
- [ ] Test QR generation flow
- [ ] Test non-app user flow

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhooks/pms/check-in` | POST | Receives room assignment from PMS |
| `/api/webhooks/pms/check-out` | POST | Receives checkout from PMS |
| `/api/bookings/:id/room` | GET | Get room assignment |
| `/api/room-qr/:bookingId` | GET | Get Room QR |
| `/api/pre-arrival/:bookingId` | GET | Get booking with room status |

---

## Summary

| Scenario | How They Access Room Hub |
|----------|------------------------|
| App user, checked-in | App → Hotel tab → Shows room → Access Hub |
| App user, not checked-in | App → Hotel tab → Shows "Room assigned at check-in" |
| Non-app user, checked-in | SMS with QR → Scan → Access Hub |
| Non-app user, not checked-in | Confirmation email → "Room QR will be sent at check-in" |
