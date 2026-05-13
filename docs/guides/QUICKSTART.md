# QUICK START

## 5 Minutes to Integration

### 1. Install
```bash
npm install @rez/sdk
```

### 2. Configure
```javascript
import { Client } from '@rez/sdk';
const rez = new Client({
  apiKey: process.env.REZ_API_KEY
});
```

### 3. Create Payment
```javascript
const payment = await rez.payments.create({
  amount: 1000,
  currency: 'INR',
  customer: { phone: '9999999999' }
});
```

### 4. Verify Webhook
```javascript
rez.webhooks.on('payment.completed', (event) => {
  console.log(event.data);
});
```

### 5. Go Live
```bash
REZ_API_KEY=sk_live_xxx node server.js
```
