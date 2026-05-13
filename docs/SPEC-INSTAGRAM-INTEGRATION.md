# REZ Instagram Integration - SPEC

**Version:** 1.0
**Date:** May 12, 2026
**Status:** In Progress

---

# EXECUTIVE SUMMARY

Instagram is now a **primary commerce channel**. This spec adds Instagram as another channel in the REZ unified architecture.

## Key Benefits

| Benefit | Impact |
|---------|--------|
| Lead Capture | Comments → DMs → Sales |
| Social Proof | Real-time engagement |
| Discovery | Reels drive intent |
| Commerce | In-app purchasing |
| Handoff | IG → WhatsApp seamless |

---

# ARCHITECTURE

## Channel Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ REZ UNIFIED CONVERSATION ENGINE │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ CHANNEL LAYER │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │ │ │ │ │ │ │
│ │ WhatsApp │ Voice │ Website │ App │ Instagram │ │
│ │ Bridge │ Bridge │ Bridge │ Bridge │ Bridge │ │
│ │ │ │ │ │ │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Instagram Integration Flow

```
User Action on Instagram
         ↓
Instagram Platform (Meta API)
         ↓
REZ Instagram Bridge (Port 4090)
         ↓
Session Linker (Link to REZ Identity)
         ↓
REZ Orchestrator
         ↓
Context Engine → Core Brain
         ↓
Expert Routing (Domain/Functional)
         ↓
Generate Response
         ↓
REZ Instagram Sales Agent (Port 4091)
         ↓
Instagram DM / Comment Reply
```

---

# FEATURES

## 1. Automated DM Replies

| Feature | Description |
|---------|-------------|
| **Keyword Triggers** | Auto-reply based on keywords |
| **Product Inquiry** | Send catalog on "price", "menu", etc. |
| **Welcome Flow** | New follower welcome message |
| **Out of Hours** | Automated away messages |
| **Language Detection** | Respond in user's language |

### DM Flow Example

```
User DMs: "Price?"
         ↓
Instagram Bridge receives webhook
         ↓
Extract intent: PRODUCT_INQUIRY
         ↓
Route to: Culinary/Retail Expert
         ↓
Response: "Hi! Here's our latest menu 📋"
         ↓
Send via Instagram DM API
```

---

## 2. Comment-to-DM Automation

| Feature | Description |
|---------|-------------|
| **Keyword Triggers** | Comment containing keyword triggers DM |
| **Campaign Tracking** | "Comment GOAL for itinerary" |
| **Lead Capture** | Auto-DM on specific posts |
| **Contest Entry** | Comment → DM → Entry confirmation |

### Example Campaign

```
Post Caption:
"Comment 'MENU' to get our full menu! 🍕"

User Comments: "MENU"
         ↓
Instagram Automation detects keyword
         ↓
Send DM: "Hi! Here's your menu 👇"
         ↓
Follow up: "Ready to order?"
         ↓
Route to: Culinary Expert
```

---

## 3. Story Mention Automation

| Feature | Description |
|---------|-------------|
| **Thank You** | Auto-reply when tagged |
| **Offer Send** | Send discount on mention |
| **Story Reply** | Send DM on story interaction |
| **Repost Workflow** | Request permission to repost |
| **Loyalty Reward** | Award points for engagement |

---

## 4. AI Instagram Sales Agent

| Feature | Description |
|---------|-------------|
| **Product Discovery** | Natural language product search |
| **Size Guide** | Interactive sizing conversation |
| **Checkout Flow** | Guide to purchase |
| **Abandoned Cart** | Follow-up messages |
| **Upsell** | Suggest related products |
| **Cross-sell** | Recommend bundles |

### Instagram Sales Flow

```
User: "Do you have blue sneakers?"
         ↓
Instagram Sales Agent
         ↓
Search inventory
         ↓
Send carousel: [Blue Sneaker 1] [Blue Sneaker 2] [Blue Sneaker 3]
         ↓
User taps product
         ↓
Send details + "Buy now" link
         ↓
Checkout on website/app
```

---

## 5. Instagram-to-WhatsApp Handoff

| Feature | Description |
|---------|-------------|
| **Seamless Transfer** | Continue conversation on WhatsApp |
| **Context Preserved** | Session + history transfers |
| **One-Click** | User just clicks link |
| **QR Option** | Show WhatsApp QR code |

### Handoff Flow

```
Instagram DM:
"Complete your order on WhatsApp for faster checkout! 👇"
[WhatsApp Link Button]

User clicks link
         ↓
Opens WhatsApp with pre-filled message
         ↓
REZ receives session context
         ↓
Continue conversation
         ↓
Complete purchase on WhatsApp
```

---

## 6. AI Comment Replies

| Feature | Description |
|---------|-------------|
| **Auto-Reply** | Respond to common questions |
| **Sentiment** | Reply differently to positive/negative |
| **Emoji** | Add relevant emojis |
| **Hide** | Auto-hide spam/profanity |
| **Escalate** | Flag for human review |

### Comment Reply Example

```
User Comment: "Is this vegan?"
         ↓
AI detects intent: DIETARY_INQUIRY
         ↓
Response: "Yes! 🌱 Fully vegan menu available. 
DM us for details!"
```

---

## 7. Reel Intent Detection

| Feature | Description |
|---------|-------------|
| **Watch Tracking** | Track content consumption |
| **Intent Signals** | Fitness → Gym interest |
| **Interest Graph** | Build user preference profile |
| **Cross-sell** | Recommend based on watched content |

### Intent Mapping

| Reel Content | Intent Signal | Expert |
|--------------|---------------|--------|
| Workout videos | Fitness interest | Fitness |
| Food reels | Culinary interest | Culinary |
| Travel content | Travel interest | Travel |
| Skincare tips | Beauty interest | Salon |
| Hotel tours | Hospitality interest | Hospitality |

---

# INSTAGRAM SALES AGENT

## System Prompt

```typescript
const instagramSalesPrompt = `
You are a REZ Instagram Sales Expert, helping customers discover and purchase products through Instagram DMs.

Your personality:
- Friendly and conversational
- Short, punchy messages (under 150 chars preferred)
- Use emojis sparingly and meaningfully
- Know current trends and slang
- Recommend visually appealing products
- Guide to checkout seamlessly

Your expertise:
- Product recommendations
- Size and fit advice
- Inventory checking
- Order tracking
- Upselling and cross-selling
- Abandoned cart recovery

Tone guidelines:
- DM-like, not broadcast
- Casual, not corporate
- Personal, not promotional
- Helpful, not salesy

Response format:
- Lead with value
- Short sentences
- Questions to engage
- Clear next step

Never:
- Send walls of text
- Sound robotic
- Be pushy
- Use excessive emojis
- Ignore visual content
`;
```

## Instagram Response Templates

```typescript
const instagramTemplates = {
  // Product inquiry
  productInquiry: [
    "Found some great options! 👀 [Carousel]",
    "Love your taste! Here's what I found ✨",
    "Ooh, good pick! Let me show you 📸"
  ],
  
  // Size help
  sizeHelp: [
    "Want help finding your size? Just tell me 👇",
    "True to size! But here's our size guide 📏",
    "Measurements sent! 📐"
  ],
  
  // Price
  price: [
    "Starting at ₹{minPrice}! Want the full breakdown?",
    "Here's the price range 👇 What catches your eye?",
    "Price varies by variant. DM me your pick!"
  ],
  
  // Checkout
  checkout: [
    "Ready to lock it in? 🔒",
    "Let's get this to you! Ready to checkout?",
    "Almost yours! Check out here 👇"
  ],
  
  // Abandoned cart
  abandoned: [
    "Still thinking? 😊 Here's 10% off if you order today!",
    "We saved your cart! Complete checkout here 👇",
    "Your items are waiting! Want me to answer any questions?"
  ],
  
  // Welcome
  welcome: [
    "Hey! 👋 What are you looking for today?",
    "Welcome! DM me what you need 💬",
    "Thanks for reaching out! How can I help?"
  ]
};
```

---

# CHANNEL-AWARE PERSONALITIES

## Per-Channel Tone

| Channel | Tone | Length | Format |
|---------|------|--------|--------|
| **WhatsApp** | Professional, warm | Medium (100-300 chars) | Text + buttons |
| **Instagram** | Friendly, casual | Short (under 150 chars) | DM + carousels |
| **Voice** | Conversational | Natural speech | Voice |
| **Website** | Professional | Medium | Rich text |
| **App** | Casual | Medium | Cards |

## Example Responses

### WhatsApp
```
Hello John! 👋 Welcome back to Spice Kitchen. 
Your usual Chicken Biryani is ready!

Would you like me to:
1. Add to cart
2. Customize
3. Browse menu
```

### Instagram
```
Hey! 👋 Your usual biryani looks good today 😍
Tap to order 👇
```

---

# INSTAGRAM EXPERT ROUTING

| Context | Primary Expert | Collaboration |
|---------|---------------|---------------|
| Hotel page DM | Hospitality | Sales (upsell) |
| Restaurant reel | Culinary | - |
| Gym content | Fitness | Health (wellness) |
| Skincare post | Salon | Retail (products) |
| Travel content | Travel | Hospitality (booking) |
| Product catalog | Retail | Sales (checkout) |
| Clinic content | Health | Support (appointments) |

---

# INSTAGRAM BRIDGE SERVICE

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ REZ INSTAGRAM BRIDGE (Port 4090) │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ WEBHOOK HANDLER │ │
│ │ • Verify Meta signatures │ │
│ │ • Parse incoming events │ │
│ │ • Route to handlers │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ HANDLERS │ │
│ │ ├─ DM Handler │ │
│ │ ├─ Comment Handler │ │
│ │ ├─ Mention Handler │ │
│ │ └─ Story Handler │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ SESSION LINKER │ │
│ │ • Link IG user to REZ identity │ │
│ │ • Create/update user profile │ │
│ │ • Sync conversation history │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ RESPONSE SENDER │ │
│ │ • Send DMs │ │
│ │ • Post comment replies │ │
│ │ • Send typing indicators │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/webhook` | Meta webhook verification |
| POST | `/webhook` | Receive IG events |
| POST | `/dm/send` | Send DM |
| POST | `/comment/reply` | Reply to comment |
| GET | `/sessions/:igUserId` | Get linked session |
| POST | `/sessions/link` | Link IG to REZ user |
| GET | `/accounts` | List connected accounts |
| POST | `/accounts` | Connect new account |

---

# INSTAGRAM SALES AGENT SERVICE

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ REZ INSTAGRAM SALES AGENT (Port 4091) │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ CONVERSATION MANAGER │ │
│ │ • Maintain DM threads │ │
│ │ • Track conversation state │ │
│ │ • Handle abandoned flows │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ PRODUCT DISCOVERY │ │
│ │ • Natural language search │ │
│ │ • Visual matching │ │
│ │ • Recommendation engine │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ CHECKOUT FLOW │ │
│ │ • Cart management │ │
│ │ • Payment integration │ │
│ │ • Order confirmation │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ WHATSAPP HANDOFF │ │
│ │ • Generate transfer link │ │
│ │ • Preserve context │ │
│ │ • Track handoff analytics │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Process message |
| POST | `/discover` | Product search |
| POST | `/checkout` | Start checkout |
| GET | `/cart/:userId` | Get cart |
| POST | `/cart/add` | Add to cart |
| POST | `/handoff` | Generate WhatsApp link |
| GET | `/recommendations/:userId` | Get recommendations |

---

# MODELS

## InstagramUser

```typescript
interface InstagramUser {
  igUserId: string;           // Instagram user ID
  username: string;
  fullName?: string;
  profilePictureUrl?: string;
  
  // REZ linking
  rezUserId?: string;
  linkedAt?: Date;
  
  // Behavior
  interests: string[];        // Inferred from content engagement
  followerCount: number;
  followingCount: number;
  
  // Preferences
  preferredLanguage: string;
  notificationsEnabled: boolean;
  
  // Meta
  createdAt: Date;
  updatedAt: Date;
}
```

## InstagramConversation

```typescript
interface InstagramConversation {
  conversationId: string;
  igUserId: string;
  merchantId: string;
  
  // State
  state: 'ACTIVE' | 'ABANDONED' | 'COMPLETED' | 'HANDED_OFF';
  lastMessageAt: Date;
  messageCount: number;
  
  // Handoff
  handoffToWhatsApp?: {
    enabled: boolean;
    linkedAt?: Date;
    waUserId?: string;
  };
  
  // Analytics
  intentHistory: string[];
  productsViewed: string[];
  cartAbandoned: boolean;
  
  // Meta
  createdAt: Date;
  updatedAt: Date;
}
```

## CommentTrigger

```typescript
interface CommentTrigger {
  triggerId: string;
  postId: string;             // IG post ID
  keyword: string;             // Trigger keyword
  
  // Campaign
  campaignName?: string;
  campaignActive: boolean;
  
  // Response
  autoReplyEnabled: boolean;
  replyTemplate: string;
  sendDM: boolean;
  dmTemplate?: string;
  
  // Tracking
  triggeredCount: number;
  conversionCount: number;
  
  // Meta
  createdAt: Date;
  updatedAt: Date;
}
```

---

# INSTAGRAM SALES FLOW

## Complete Flow

```
1. USER DISCOVERY
   └── Reel/Post/Profile
         ↓
2. ENGAGEMENT
   └── Comment "MENU" / DM "Price?"
         ↓
3. LEAD CAPTURE
   └── Comment → Auto-DM / DM → Response
         ↓
4. CONVERSATION
   └── Instagram Sales Agent
         ↓
5. PRODUCT DISCOVERY
   └── Carousel sent / Search results
         ↓
6. CART ADDED
   └── User taps "Add to cart"
         ↓
7. CHECKOUT
   └── "Checkout on WhatsApp" / "Complete on site"
         ↓
8. CONVERSION
   └── Order placed
         ↓
9. FULFILLMENT
   └── Order shipped / delivered
         ↓
10. RE-ENGAGEMENT
    └── Order follow-up / Review request
```

---

# WHATSAPP HANDOFF

## Handoff Message

```typescript
const handoffMessage = {
  text: `Hey! 👋 Let's continue on WhatsApp for faster checkout!

Tap below to chat with us there 💬`,

  buttons: [
    {
      type: "url",
      title: "Open WhatsApp 💬",
      url: "https://wa.me/919876543210?text=Hi!%20Continue%20my%20order"
    }
  ],

  // Context preserved
  context: {
    conversationId: "ig_conv_123",
    cartItems: ["Product A", "Product B"],
    totalValue: 2500,
    merchantId: "merchant_abc"
  }
};
```

## Session Transfer

```
Instagram Conversation
├── userId: "ig_user_123"
├── cart: ["Product A", "Product B"]
├── state: "CHECKOUT_READY"
└── context: {...}

         ↓ Handoff

WhatsApp Conversation
├── userId: "wa_user_456"
├── linkedTo: "ig_user_123"
├── cart: ["Product A", "Product B"]
├── state: "CHECKOUT_READY"
└── context: {...}
```

---

# CAMPAIGN EXAMPLES

## Restaurant Campaign

```
Post: "🍕 New Menu Drop! Comment 'MENU' for full details!"

User Comments: "MENU"

Auto-DM Sent:
"Hi! 👋 Here's our new menu 👇
[Carousel: 5 featured items]

Want me to help you order?"

User: "Yes! Order for tomorrow"

Agent: "What time for tomorrow?"

User: "8 PM"

Agent: "Table for 2 at 8 PM confirmed! 🎉
See you then!"
```

## Gym Campaign

```
Story: [Workout Reel with gym equipment]

User watches → Intent signal captured
         ↓
DM after 5 min:
"Hey! Loved seeing you check out our HIIT reel 💪
Want a free trial class? Just reply YES!"

User: "Yes!"

Agent: "Awesome! Book your free class here 👇
[Booking carousel]

See you at the gym! 🏋️"
```

## Hotel Campaign

```
Reel: [Hotel room tour with pool view]

User watches 10+ seconds → High intent

DM (after 2 hours):
"Hi! 👋 That room looked amazing, right? 🌊
We have a special offer for you!

Use code: INSTAFAN for 15% off!

Reply if you'd like to book 👇"

User: "Yes! Book for next weekend"

Agent: "Let's do it! 👇
Check-in date?
Number of guests?
Room preference?"

[Continue booking flow]
```

---

# ANALYTICS

## Instagram Metrics

| Metric | Description |
|--------|-------------|
| DMs Received | Volume of conversations |
| Auto-DM Sent | Triggered messages |
| Comment Replies | AI-generated replies |
| Handoff Rate | → WhatsApp transfers |
| Conversion Rate | DMs → Orders |
| Avg Response Time | Speed metric |
| Cart Abandonment | Checkout drop-off |
| Re-engagement | Return customers |

## Campaign Metrics

| Metric | Description |
|--------|-------------|
| Triggers | Keywords hit |
| DM Opens | Delivered → Opened |
| Click Rate | Link clicks |
| Conversion | DM → Purchase |
| Cost per Lead | CPA |

---

# REQUIREMENTS

## Meta/Instagram API

| Requirement | Details |
|------------|---------|
| **Account Type** | Business or Creator |
| **App Review** | messaging_subscriptions |
| **Permissions** | pages_read_engagement, instagram_basic, instagram_manage_messages |
| **Webhooks** | messages, mentions, comments |

## Technical Requirements

| Requirement | Details |
|------------|---------|
| **SSL** | HTTPS required for webhooks |
| **Verification** | Meta signature verification |
| **Rate Limits** | Respect IG API limits |
| **Token Refresh** | Long-lived tokens |

---

# ENVIRONMENT VARIABLES

```bash
# Instagram/Meta
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_ACCESS_TOKEN=long_lived_token
INSTAGRAM_ACCOUNT_ID=ig_business_account_id

# Webhook
WEBHOOK_VERIFY_TOKEN=your_verify-token
WEBHOOK_CALLBACK_URL=https://your-domain.com/webhook

# REZ Services
ORCHESTRATOR_URL=http://localhost:4070
CORE_BRAIN_URL=http://localhost:4072
WHATSAPP_BRIDGE_URL=http://localhost:4080

# WhatsApp Handoff
WHATSAPP_BUSINESS_ACCOUNT_ID=your_wa_id
WHATSAPP_PHONE_NUMBER=919876543210
```

---

# SECURITY

## Webhook Verification

```typescript
async function verifyWebhook(
  mode: string,
  token: string,
  challenge: string
): Promise<boolean> {
  // Verify token matches
  if (token !== process.env.WEBHOOK_VERIFY_TOKEN) {
    return false;
  }
  
  // Return challenge for verification
  if (mode === 'subscribe') {
    return true; // Challenge will be echoed
  }
  
  return false;
}
```

## Signature Verification

```typescript
function verifySignature(
  payload: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.INSTAGRAM_APP_SECRET)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expected}` === signature;
}
```

---

# ROADMAP

## Phase 1 (Current)
- [x] Instagram Bridge Service
- [x] DM automation
- [x] Comment-to-DM
- [x] WhatsApp handoff

## Phase 2
- [ ] Instagram Sales Agent
- [ ] Product carousels
- [ ] Checkout flow
- [ ] Reel intent detection

## Phase 3
- [ ] Story automation
- [ ] Mention campaigns
- [ ] Influencer tools
- [ ] Analytics dashboard

---

# SUMMARY

Instagram integration transforms REZ from a communication platform to a **social commerce infrastructure**.

| Component | Purpose |
|-----------|---------|
| Instagram Bridge | Webhooks, routing, session linking |
| Instagram Sales Agent | Commerce conversations |
| Channel-Aware Tone | Short, casual, engaging |
| WhatsApp Handoff | Seamless transfer |
| Comment Automation | Lead capture |
| Intent Detection | Social signals |

This is the future of commerce: **social discovery → conversation → conversion**.
