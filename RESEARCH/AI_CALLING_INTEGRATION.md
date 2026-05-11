# AI Calling Integration with REZ Support Copilot

**Version:** 1.0
**Date:** May 9, 2026

---

## Current State

### REZ Support Copilot (`REZ-support-copilot`)
- **Type:** Text-based chat support
- **Port:** 4033
- **Intents:** ORDER, BOOK, ENQUIRE, COMPLAINT, GREETING, SEARCH, PAYMENT, DELIVERY, FEEDBACK, RESCHEDULE, CANCEL, DIETARY, OPENING_HOURS, LOCATION, CONTACT, LOYALTY, GIFT
- **Integrations:** Order Service, Booking Service, Search Service
- **AI:** Intent classifier, response generation

### Voice AI (`rez-ai-voice`)
- **Type:** Speech-to-text + voice response
- **Purpose:** Phone ordering, drive-thru, tableside
- **Verticals:** Restaurant, Salon, Fitness, Hotel

---

## Analysis: Should Voice Be Part of Support Copilot?

### YES - Benefits

| Benefit | Explanation |
|---------|-------------|
| **Single Intent Engine** | One place to handle all customer intents (text + voice) |
| **Shared Context** | Voice + chat share conversation history |
| **Unified Knowledge Base** | Same KB for voice and text |
| **Easier Maintenance** | One service to update |
| **Consistent Experience** | Same AI response whether voice or text |
| **Cost Efficiency** | Shared compute, shared models |

### Architecture Option

```
Customer
    │
    ├── Text (Chat) ──────► Support Copilot
    │                              │
    ├── Voice (Phone) ─────────────┘
    │         │                      │
    │    Speech-to-Text              │
    │         │                      │
    └─────────┴──────────────────────►│
                                        │
                                   Intent Detection
                                        │
                                   Action Executor
                                        │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
               Order Service      Booking Service     Knowledge Base
```

---

## Recommended Architecture

### Option A: Merge Voice Into Support Copilot

```
REZ-support-copilot/
├── src/
│   ├── index.js           # Express server
│   ├── voice/             # NEW: Voice module
│   │   ├── stt.js         # Speech-to-text
│   │   ├── tts.js         # Text-to-speech
│   │   ├── twilio.js      # Twilio webhook
│   │   └── daily.co.js    # Daily.co webhook
│   ├── text/               # EXISTING: Text module
│   │   ├── intents/        # Intent handlers
│   │   └── responses/       # Response generation
│   └── shared/            # SHARED
│       ├── intentClassifier.js  # ONE intent engine
│       ├── knowledgeBase.js    # ONE KB
│       └── actions.js          # Action executors
```

### Option B: Voice as Separate Module (Tight Integration)

```
REZ-support-copilot/
└── voice/
    └── (Voice AI code here)
        ├── stt.js
        ├── tts.js
        └── Integrates with existing intent classifier
```

---

## Integration Plan

### Step 1: Add Voice Module to Support Copilot

Add to `REZ-support-copilot/src/`:
```
voice/
├── stt.js              # Whisper/Deepgram integration
├── tts.js              # ElevenLabs/Polly integration
├── twilioWebhook.js    # Phone call handling
├── voiceIntents.js    # Voice-specific intents
└── index.js            # Voice route handler
```

### Step 2: Integrate STT with Existing Intent Engine

```javascript
// voice/stt.js
const speechToText = async (audioBuffer) => {
  // Use Whisper API
  const transcript = await whisper.transcribe(audioBuffer);
  return transcript.text;
};

// voice/twilioWebhook.js
app.post('/webhook/voice', async (req, res) => {
  const recording = req.body.RecordingUrl;
  const audio = await downloadAudio(recording);
  
  // Convert speech to text
  const text = await speechToText(audio);
  
  // Use EXISTING intent classifier
  const intent = await intentClassifier.classify(text);
  
  // Use EXISTING response generator
  const response = await generateResponse(intent);
  
  // Convert to speech
  const audioResponse = await textToSpeech(response);
  
  // Send TwiML
  res.xml(`<Response><Play>${audioResponse}</Play></Response>`);
});
```

### Step 3: Add Voice-Specific Intents

```javascript
// voice/voiceIntents.js
const VOICE_INTENTS = {
  // Phone-specific
  'speak_to_agent': 'Connect me to someone',
  'repeat': 'Say that again',
  'slower': 'Speak slower',
  'louder': 'Speak louder',
  
  // Quick actions
  'order_status': "Check my order",
  'cancel_order': "Cancel my order",
  'speak_to_manager': "Manager please"
};
```

### Step 4: Add TTS for Voice Responses

```javascript
// voice/tts.js
const textToSpeech = async (text, voice = 'amy') => {
  // Use ElevenLabs
  const audio = await elevenLabs.synthesize({
    text,
    voice,
    model: 'eleven_multilingual_v2'
  });
  return audio;
};
```

---

## Code Changes

### 1. Add to package.json

```json
{
  "dependencies": {
    "openai": "^1.0.0",        // Whisper API
    "elevenlabs": "^1.0.0",    // ElevenLabs API
    "twilio": "^4.0.0"        // Twilio SDK
  }
}
```

### 2. Create voice module

**File:** `REZ-support-copilot/src/voice/stt.js`
```javascript
const speechToText = async (audioUrl) => {
  const audio = await axios.get(audioUrl, { responseType: 'arraybuffer' });
  
  const response = await openai.audio.transcriptions.create({
    file: audio.data,
    model: 'whisper-1',
    response_format: 'text'
  });
  
  return response.text;
};

module.exports = { speechToText };
```

**File:** `REZ-support-copilot/src/voice/tts.js`
```javascript
const textToSpeech = async (text, options = {}) => {
  const { voice = 'amy', language = 'en-IN' } = options;
  
  const audio = await elevenLabs.generate({
    text,
    voice,
    model: 'eleven_multilingual_v2'
  });
  
  return audio;
};

module.exports = { textToSpeech };
```

### 3. Add voice webhook

**File:** `REZ-support-copilot/src/voice/twilioWebhook.js`
```javascript
const express = require('express');
const router = express.Router();
const { speechToText } = require('./stt');
const { textToSpeech } = require('./tts');

// Existing intent classifier from support copilot
const intentClassifier = require('../intentClassifier');
const { generateResponse } = require('../responseGenerator');

router.post('/twilio', async (req, res) => {
  const { RecordingUrl, CallSid } = req.body;
  
  try {
    // 1. Speech to Text
    const transcript = await speechToText(RecordingUrl);
    
    // 2. Intent Detection (using EXISTING classifier)
    const intent = await intentClassifier.classify(transcript);
    
    // 3. Generate Response (using EXISTING response generator)
    const response = await generateResponse(intent);
    
    // 4. Text to Speech
    const audio = await textToSpeech(response.message);
    
    // 5. Return TwiML
    res.type('text/xml').send(`
      <Response>
        <Say voice="Polly.Amy">${response.message}</Say>
        <Gather numDigits="1" action="/webhook/voice/twilio/process">
          <Say>Press 1 to repeat, 0 for operator.</Say>
        </Gather>
      </Response>
    `);
  } catch (error) {
    console.error('[Voice] Error:', error);
    res.xml('<Response><Say>I apologize, I had trouble understanding. Please try again.</Say></Response>');
  }
});

module.exports = router;
```

### 4. Register voice routes

**File:** `REZ-support-copilot/src/index.js`
```javascript
// Add after existing imports
const voiceWebhook = require('./voice/twilioWebhook');

// Add after existing routes
app.use('/webhook/voice', voiceWebhook);

// Health check for voice
app.get('/health/voice', (req, res) => {
  res.json({ 
    service: 'REZ Support Copilot - Voice',
    status: 'ready',
    capabilities: ['text', 'voice']
  });
});
```

---

## Environment Variables

```bash
# Speech-to-Text
OPENAI_API_KEY=sk-...

# Text-to-Speech
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=amy

# Phone (optional - for voice calls)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Daily.co (optional - for video calls)
DAILY_API_KEY=...
```

---

## Testing

```bash
# Test text intent
curl -X POST http://localhost:4033/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to order biryani"}'

# Test voice intent (mock)
curl -X POST http://localhost:4033/webhook/voice/twilio \
  -F "RecordingUrl=https://example.com/recording.mp3"
```

---

## Deployment

```yaml
# docker-compose.yml
services:
  support-copilot:
    build: ./REZ-support-copilot
    ports:
      - "4033:4033"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
    volumes:
      - ./REZ-support-copilot:/app
```

---

## Summary

| Question | Answer |
|----------|--------|
| **Should voice be part of support copilot?** | YES |
| **Why?** | Single intent engine, shared context, unified KB |
| **Changes needed?** | Add voice module (STT, TTS, webhooks) |
| **Keep existing code?** | YES - integrate, don't replace |
| **Deploy separate?** | NO - single service |

---

## Next Steps

1. **Add voice module** to `REZ-support-copilot/src/voice/`
2. **Integrate STT** (Whisper API)
3. **Integrate TTS** (ElevenLabs)
4. **Add Twilio webhook**
5. **Test** voice + text intents
6. **Deploy** unified service

---

## Files to Create

```
REZ-support-copilot/src/voice/
├── stt.js              # Speech-to-text
├── tts.js              # Text-to-speech
├── twilioWebhook.js    # Phone webhook
├── dailyWebhook.js      # Video webhook
├── voiceIntents.js     # Voice-specific intents
└── index.js            # Route exports
```

---

*Document Version: 1.0*
*Last Updated: May 9, 2026*
