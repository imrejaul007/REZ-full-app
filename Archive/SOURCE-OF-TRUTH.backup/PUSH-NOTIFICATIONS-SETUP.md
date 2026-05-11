# REZ Platform - Push Notifications Setup Guide

This guide enables push notifications across all REZ apps.

---

## Current Status

| App | Feature Flag | Status |
|-----|--------------|--------|
| REZ Consumer | `EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS` | `false` |
| REZ Merchant | - | Not configured |
| Hotel OTA | - | Not configured |

---

## REZ Consumer App Setup

### Step 1: Enable Firebase Cloud Messaging

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `rez-app-e450d`
3. Navigate to **Messaging** in the left sidebar
4. Click **Create first campaign** or go to **Settings** > **Cloud Messaging**
5. Copy the **Server key** (FCM server key)

### Step 2: Configure Expo Push Credentials

1. Go to [Expo Push Console](https://expo.dev/notifications)
2. Select your project
3. Navigate to **Credentials** (for iOS) or **Android** (for Android)
4. Upload your credentials:
   - **iOS**: APNs certificates (push certificate + private key)
   - **Android**: FCM server key

### Step 3: Enable in Environment

#### Option A: Update eas.json

Edit `rez-app-consumer/eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS": "true"
      }
    }
  }
}
```

#### Option B: Create Environment File

Create `.env.production`:

```bash
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
```

### Step 4: Rebuild App

```bash
# Development build
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production build
eas build --platform ios --profile production
eas build --platform android --profile production
```

---

## Backend Push Service

### Current Implementation

The push notification service exists at:
```
rez-backend/src/services/PushNotificationService.ts
```

### Endpoints

#### POST /api/notifications/send
Send push notification to user.

**Request:**
```json
{
  "userId": "user_123",
  "title": "Order Update",
  "body": "Your order has been confirmed!",
  "data": {
    "type": "order",
    "orderId": "order_456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "notificationId": "notif_789"
}
```

### Environment Variables

```bash
# Firebase Cloud Messaging
FCM_SERVER_KEY=your_fcm_server_key
FIREBASE_PROJECT_ID=rez-app-e450d
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Expo Push
EXPO_ACCESS_TOKEN=your_expo_access_token
```

---

## Notification Types

| Type | Title | Body | Data |
|------|-------|------|------|
| Order Placed | Order Confirmed | Your order #{id} is being prepared | `{type: "order", id}` |
| Order Ready | Order Ready! | Your order is ready for pickup | `{type: "order", id}` |
| Payment Received | Payment Successful | ₹{amount} received | `{type: "payment", id}` |
| Loyalty Points | Points Earned! | You earned {points} coins | `{type: "loyalty", id}` |
| Promotion | {title} | {body} | `{type: "promotion", id}` |
| Booking Confirmed | Booking Confirmed | Your stay at {hotel} is confirmed | `{type: "booking", id}` |
| Check-in Reminder | Check-in Reminder | Your booking at {hotel} starts tomorrow | `{type: "booking", id}` |

---

## Testing Push Notifications

### Test Locally

```bash
# Start Expo with tunnel (for push notifications)
npx expo start --tunnel

# Send test notification via Expo Push
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[xxxxxxx]",
    "title": "Test",
    "body": "This is a test notification"
  }'
```

### Test in Production

1. Use Expo's **Push Notifications** tool in the dashboard
2. Select your app and enter test credentials
3. Send test notification

---

## Monitoring Push Delivery

### Metrics to Track

| Metric | Target | Alert |
|--------|--------|-------|
| Delivery Rate | > 95% | < 90% |
| Open Rate | > 20% | < 10% |
| Error Rate | < 2% | > 5% |
| Unsubscribe Rate | < 1% | > 3% |

### Check Delivery Status

```bash
# Check notification receipt
curl https://exp.host/--/api/v2/push/ACK \
  -H "Content-Type: application/json" \
  -d '{"ids": ["notification_id_1", "notification_id_2"]}'
```

---

## User Preferences

Allow users to control notification types:

```typescript
interface NotificationPreferences {
  orderUpdates: boolean;      // Default: true
  promotions: boolean;        // Default: true
  loyaltyUpdates: boolean;    // Default: true
  chatMessages: boolean;      // Default: true
  bookings: boolean;          // Default: true
  reminders: boolean;         // Default: true
}
```

---

## Quick Enable Checklist

- [ ] Get FCM Server Key from Firebase Console
- [ ] Configure Expo Push credentials for iOS and Android
- [ ] Update `EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true` in eas.json
- [ ] Rebuild the app with `eas build`
- [ ] Test push notifications manually
- [ ] Enable monitoring dashboard
- [ ] Set up delivery alerts

---

## Common Issues

### Notifications Not Arriving

1. Check if user has granted notification permission
2. Verify FCM/APNs credentials are correct
3. Check if device token is valid
4. Review Firebase/Expo console for errors

### APNs Certificate Expired

1. Generate new APNs certificate in Apple Developer Console
2. Upload to Expo Push Console
3. Rebuild the app

### FCM Not Working on Android 13+

Android 13+ requires runtime permission for notifications. Ensure the app handles:
```typescript
const { status } = await Notifications.requestPermissionsAsync();
```

---

## Related Documentation

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [APNs Configuration](https://developer.apple.com/documentation/usernotifications)
