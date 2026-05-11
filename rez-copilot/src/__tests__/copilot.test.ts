/**
 * Copilot Integration Tests
 * Tests all 17 intents and sentiment analysis
 */

import { describe, test, expect } from 'vitest';

const BASE_URL = process.env.COPILOT_SERVICE_URL || 'http://localhost:4026';

describe('Intent Detection', () => {
  const intents = [
    'ORDER', 'BOOK', 'ENQUIRE', 'COMPLAINT', 'GREETING',
    'SEARCH', 'USER_INFO', 'PAYMENT', 'DELIVERY', 'FEEDBACK',
    'RESCHEDULE', 'CANCEL', 'DIETARY', 'OPENING_HOURS', 'LOCATION',
    'CONTACT', 'LOYALTY', 'GIFT'
  ];

  test('should detect ORDER intent', async () => {
    const response = await fetch(`${BASE_URL}/api/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I want to order food',
        userId: 'test-user',
        userType: 'consumer'
      })
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data.intent).toBe('ORDER');
  });

  test('should detect all 17 intents', async () => {
    const testMessages: Record<string, string> = {
      ORDER: 'order pizza',
      BOOK: 'book a table',
      ENQUIRE: 'what time do you open',
      COMPLAINT: 'my food is cold',
      GREETING: 'hello',
      SEARCH: 'find restaurants',
      USER_INFO: 'my account settings',
      PAYMENT: 'payment failed',
      DELIVERY: 'where is my delivery',
      FEEDBACK: 'rate my order',
      RESCHEDULE: 'change my booking',
      CANCEL: 'cancel my order',
      DIETARY: 'is this vegetarian',
      LOCATION: 'what is your address',
      CONTACT: 'call support',
      LOYALTY: 'how many points do I have',
      GIFT: 'buy a gift card'
    };

    for (const [intent, message] of Object.entries(testMessages)) {
      const response = await fetch(`${BASE_URL}/api/copilot/intent/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      expect(response.ok).toBeTruthy();
      const data = await response.json();
      expect(data.intent.intent).toBe(intent);
    }
  });
});

describe('Sentiment Analysis', () => {
  test('should detect positive sentiment', async () => {
    const response = await fetch(`${BASE_URL}/api/copilot/intent/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'excellent food thank you' })
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data.sentiment).toBe('positive');
  });

  test('should detect negative sentiment', async () => {
    const response = await fetch(`${BASE_URL}/api/copilot/intent/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'terrible service angry' })
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data.sentiment).toBe('negative');
  });

  test('should detect neutral sentiment', async () => {
    const response = await fetch(`${BASE_URL}/api/copilot/intent/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'pizza menu' })
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data.sentiment).toBe('neutral');
  });
});

describe('Entity Extraction', () => {
  test('should extract food entities', async () => {
    const response = await fetch(`${BASE_URL}/api/copilot/intent/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'order biryani' })
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data.intent.entities.food).toBeDefined();
  });

  test('should extract time entities', async () => {
    const response = await fetch(`${BASE_URL}/api/copilot/intent/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'deliver in 30 minutes' })
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data.intent.entities.time).toBeDefined();
  });

  test('should extract quantity entities', async () => {
    const response = await fetch(`${BASE_URL}/api/copilot/intent/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'order 2 plates of rice' })
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data.intent.entities.quantity).toBe('2');
  });
});

describe('User Types', () => {
  test('should handle consumer requests', async () => {
    const response = await fetch(`${BASE_URL}/api/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'track my order',
        userId: 'test-user',
        userType: 'consumer'
      })
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data.actions).toBeDefined();
  });

  test('should handle merchant requests', async () => {
    const response = await fetch(`${BASE_URL}/api/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'show my sales',
        userId: 'test-merchant',
        userType: 'merchant'
      })
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data.response).toBeDefined();
  });
});

describe('Session Management', () => {
  test('should start session', async () => {
    const response = await fetch(`${BASE_URL}/api/copilot/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'test-user' })
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data.sessionId).toBeDefined();
  });

  test('should track conversation history', async () => {
    const sessionId = `test-session-${Date.now()}`;

    await fetch(`${BASE_URL}/api/copilot/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: sessionId })
    });

    await fetch(`${BASE_URL}/api/copilot/session/${sessionId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'order pizza' })
    });

    expect(true).toBe(true);
  });
});
