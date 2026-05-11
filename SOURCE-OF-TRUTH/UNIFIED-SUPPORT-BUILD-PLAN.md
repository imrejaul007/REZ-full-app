# UNIFIED SUPPORT SYSTEM - BUILD PLAN

**Date:** 2026-05-02
**Goal:** Build unified AI support for all QR entry points

---

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    BUILD UNIFIED SUPPORT SYSTEM                                ║
║                                                                                   ║
║           Option 2: Build First, Then Deploy                                 ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```

---

## HOW REZ MIND WORKS TOGETHER

```
CUSTOMER SCANS QR CODE
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 REZ-support-copilot                           │
│              (Unified Support Chat)                            │
└─────────────────────────┬─────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ REZ-intelligence-hub  │
              │   (Analyzes intent)   │
              └───────────┬───────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
    ▼                     ▼                     ▼
┌───────────┐    ┌───────────────┐    ┌─────────────┐
│   USER    │    │   MERCHANT   │    │   INTENT    │
│ INTELLIG.│    │  INTELLIG.   │    │ PREDICTOR   │
└─────┬─────┘    └──────┬────────┘    └──────┬──────┘
      │                 │                    │
      └─────────────────┼────────────────────┘
                        │
                        ▼
              ┌───────────────────────┐
              │ REZ-event-platform   │
              │   (Logs events)     │
              └───────────┬───────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌───────────┐  ┌───────────┐  ┌───────────┐
    │   ORDER   │  │  MERCHANT │  │  CATALOG  │
    │  SERVICE  │  │  SERVICE  │  │  SERVICE  │
    └───────────┘  └───────────┘  └───────────┘
```

---

## STEP 1: DEPLOY MISSING SERVICES

### 1.1 DEPLOY THESE NOW (7 services)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ #  Service                          │ Status     │ Action                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1  REZ-user-intelligence-service   │ Not found  │ Deploy on Render      │
│ 2  REZ-intent-predictor            │ Not found  │ Deploy on Render      │
│ 3  REZ-support-copilot            │ Ready      │ Deploy + Build        │
│ 4  REZ-ad-copilot                 │ Ready      │ Deploy on Render      │
│ 5  REZ-action-engine              │ Ready      │ Deploy on Render      │
│ 6  REZ-feedback-service          │ Ready      │ Deploy on Render      │
│ 7  REZ-merchant-intelligence     │ Fixed      │ Redeploy on Render    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 QUICK DEPLOY COMMANDS

```
Render Dashboard → NEW → Web Service

1. REZ-user-intelligence-service
   GitHub: imrejaul007/REZ-user-intelligence-service
   Port: 3004

2. REZ-intent-predictor
   GitHub: imrejaul007/REZ-intent-predictor
   Port: 4018

3. REZ-support-copilot
   GitHub: imrejaul007/REZ-support-copilot
   Port: 4033

4. REZ-ad-copilot
   GitHub: imrejaul007/REZ-ad-copilot

5. REZ-action-engine
   GitHub: imrejaul007/REZ-action-engine
   Port: 4009

6. REZ-feedback-service
   GitHub: imrejaul007/REZ-feedback-service
   Port: 4010

7. REZ-merchant-intelligence-service
   → Just click Redeploy (already fixed)
```

---

## STEP 2: BUILD UNIFIED SUPPORT

### 2.1 UNIFIED CHAT UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         UNIFIED CHAT UI                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Requirements:                                                              │
│  ├── Single chat interface for all QR entry points                        │
│  ├── Works on mobile (REZ NOW, Hotel Room, Web Menu)                      │
│  ├── Integrates with REZ-support-copilot                                  │
│  ├── Shows order/book/enquire options                                      │
│  └── Connects to user profile                                              │
│                                                                             │
│  Features:                                                                  │
│  ├── Real-time chat with AI                                                │
│  ├── Order placement button                                                │
│  ├── Book reservation button                                              │
│  ├── Quick action buttons                                                 │
│  ├── Order history                                                        │
│  └── Payment integration                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 KNOWLEDGE BASE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MERCHANT KNOWLEDGE BASE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Structure:                                                                │
│  ├── merchant_id                                                           │
│  ├── business_info                                                         │
│  │   ├── name, address, hours                                             │
│  │   ├── contact, social links                                            │
│  │   └── policies (cancel, delivery, min order)                         │
│  ├── menu_data                                                            │
│  │   ├── categories                                                      │
│  │   ├── items (name, price, desc, images)                               │
│  │   ├── modifiers (size, extras)                                        │
│  │   └── dietary info (veg, vegan, allergen)                            │
│  ├── faq                                                                  │
│  │   ├── questions & answers                                             │
│  │   └── common issues                                                   │
│  └── training_docs                                                         │
│      ├── uploaded files                                                   │
│      └── custom responses                                                 │
│                                                                             │
│  Import Options:                                                           │
│  ├── CSV upload (menu)                                                     │
│  ├── JSON upload (structured data)                                        │
│  ├── PDF upload (documents)                                               │
│  └── API integration                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 ADMIN TRAINING INTERFACE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ADMIN TRAINING INTERFACE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Features:                                                                  │
│  ├── Upload books (PDF, ePub)                                              │
│  ├── Add articles (URL or text)                                            │
│  ├── Upload training documents                                             │
│  ├── Add custom FAQs                                                      │
│  ├── Set response templates                                                │
│  ├── View conversation logs                                                │
│  └── Analytics dashboard                                                  │
│                                                                             │
│  Training Options:                                                         │
│  ├── Restaurant-specific training                                           │
│  ├── Hotel-specific training                                               │
│  ├── General support training                                              │
│  └── Product-specific training                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 USER PERSONALIZATION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      USER PERSONALIZATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  What REZ Mind learns:                                                     │
│  ├── Order history & preferences                                           │
│  ├── Dietary restrictions                                                 │
│  ├── Favorite items/restaurants                                           │
│  ├── Average spending                                                     │
│  ├── Preferred dining times                                               │
│  ├── Communication style                                                  │
│  └── Feedback patterns                                                    │
│                                                                             │
│  Personalization features:                                                 │
│  ├── "Your usual?" suggestions                                            │
│  ├── Dietary-safe recommendations                                         │
│  ├── Birthday/occasion reminders                                          │
│  ├── Price-sensitive suggestions                                          │
│  └── Mood-based recommendations                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## STEP 3: CONNECT QR ENTRY POINTS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        QR ENTRY POINTS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. REZ NOW QR                                                            │
│     ├── Restaurant orders                                                 │
│     ├── Quick commerce                                                    │
│     └── Delivery tracking                                                 │
│                                                                             │
│  2. HOTEL ROOM QR                                                        │
│     ├── Room service                                                     │
│     ├── Housekeeping                                                     │
│     ├── Concierge                                                        │
│     └── Tourist info                                                     │
│                                                                             │
│  3. WEB MENU QR                                                          │
│     ├── Browse menu                                                       │
│     ├── Order for dine-in                                                │
│     ├── Book table                                                       │
│     └── Pay at table                                                     │
│                                                                             │
│  All connect to: REZ-support-copilot + unified chat UI                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## IMPLEMENTATION PLAN

### PHASE 1: Deploy Core (Today)
```
☐ Deploy all 7 missing services on Render
☐ Test connectivity between services
☐ Verify event flow works
```

### PHASE 2: Build Chat UI (This Week)
```
☐ Create unified chat component
☐ Integrate with REZ-support-copilot
☐ Add order/book/enquire buttons
☐ Test on mobile
```

### PHASE 3: Knowledge Base (This Week)
```
☐ Design database schema
☐ Create import templates
☐ Build admin interface
☐ Import sample data
```

### PHASE 4: Training (This Week)
```
☐ Build upload interface
☐ Add PDF/text processing
☐ Create FAQ manager
☐ Train initial model
```

### PHASE 5: Personalization (Next Week)
```
☐ Connect user profiles
☐ Build recommendation engine
☐ Add preference learning
☐ Test personalization
```

---

## REPOSITORIES TO CREATE/UPDATE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NEW/EXISTING REPOS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  EXISTING:                                                                 │
│  ├── REZ-support-copilot          → Update with unified support           │
│  ├── rez-app-consumer             → Add chat UI                           │
│  └── rez-app-merchant             → Add chat UI                           │
│                                                                             │
│  NEW:                                                                       │
│  ├── rez-unified-chat            → Shared chat component                  │
│  ├── rez-knowledge-base          → Knowledge base service                │
│  ├── rez-admin-training          → Admin training interface               │
│  └── rez-unified-chat-ui         → Frontend chat UI                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ESTIMATED TIME

```
PHASE 1 (Deploy):          30 minutes
PHASE 2 (Chat UI):         2-3 days
PHASE 3 (Knowledge Base):  2-3 days
PHASE 4 (Training):        2 days
PHASE 5 (Personalization): 3-4 days

TOTAL:                     10-14 days
```

---

## NEXT STEPS

```
1. Deploy 7 missing services on Render
2. Verify all services are communicating
3. Start building unified chat UI
4. Create knowledge base structure
5. Build admin training interface
```

---

**Last Updated:** 2026-05-02
**Status:** Plan ready - Execute Phase 1
