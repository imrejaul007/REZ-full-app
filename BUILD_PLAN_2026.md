# ReZ Ecosystem - Build Plan 2026

**Date:** May 8, 2026
**Goal:** Complete all missing features in 12 weeks

---

## PHASE 1: Consumer App Enhancements (Week 1-2)

### 1.1 Split Bill Feature

**Files to Create/Modify:**
```
app-consumer/
├── app/store-visit/[id]/
│   └── split-bill.tsx          (NEW)
├── services/
│   └── splitService.ts         (NEW)
└── components/
    └── SplitBillModal.tsx       (NEW)
```

**Implementation:**

```typescript
// services/splitService.ts
interface SplitBillRequest {
  orderId: string;
  splits: {
    amount: number;
    method: 'upi' | 'card' | 'wallet';
  }[];
}

async function splitBill(request: SplitBillRequest): Promise<SplitResponse> {
  const response = await api.post('/orders/split', request);
  return response;
}
```

**API Endpoint (Merchant Service):**
```typescript
// In merchant service
router.post('/orders/:id/split', async (req, res) => {
  const { splits } = req.body;
  const order = await Order.findById(req.params.id);
  
  // Create child orders
  for (const split of splits) {
    const childOrder = await Order.create({
      parentOrderId: order._id,
      amount: split.amount,
      paymentMethod: split.method,
      status: 'pending'
    });
  }
  
  // Update parent order
  order.status = 'partially_paid';
  await order.save();
  
  return res.json({ success: true, splits: childOrders });
});
```

### 1.2 Social Login

**Files to Create/Modify:**
```
app-consumer/
├── app/auth/
│   ├── google-login.tsx          (NEW)
│   └── apple-login.tsx           (NEW)
├── services/
│   └── socialAuthService.ts      (NEW)
└── app/StoreListPage.tsx        (MODIFY)
```

**Implementation:**

```typescript
// services/socialAuthService.ts
import * as Google from 'expo-google-sign-in';
import * as AppleAuthentication from 'expo-apple-authentication';

async function signInWithGoogle(): Promise<User> {
  await Google.signInAsync({
    clientId: process.env.GOOGLE_CLIENT_ID,
    scopes: ['profile', 'email']
  });
  // Send token to backend
  const response = await api.post('/auth/google', { 
    idToken: googleUser.idToken 
  });
  return response.user;
}

async function signInWithApple(): Promise<User> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL
    ]
  });
  const response = await api.post('/auth/apple', {
    identityToken: credential.identityToken
  });
  return response.user;
}
```

---

## PHASE 2: Loyalty Enhancements (Week 3-5)

### 2.1 Referral System

**Files to Create/Modify:**
```
rez-merchant-service/
├── src/routes/
│   └── referral.ts               (NEW)
├── src/services/
│   └── referralService.ts        (NEW)
└── src/models/
    └── Referral.ts                (NEW)
```

**Schema:**
```typescript
// models/Referral.ts
@Schema()
export class Referral {
  @Prop({ required: true })
  referrerId: Types.ObjectId;        // Who invited

  @Prop({ required: true })
  referredId: Types.ObjectId;        // Who joined

  @Prop({ required: true })
  merchantId: Types.ObjectId;

  @Prop({ default: 'pending' })
  status: 'pending' | 'completed' | 'expired';

  @Prop()
  referrerReward: {
    points: number;
    awardedAt: Date;
  };

  @Prop()
  referredReward: {
    points: number;
    awardedAt: Date;
  };

  @Prop({ default: Date.now, expires: 30 * 24 * 60 * 60 })
  createdAt: Date;                  // Expires in 30 days
}
```

**Service:**
```typescript
// services/referralService.ts
async function processReferral(
  referrerId: string, 
  referredId: string, 
  merchantId: string
): Promise<void> {
  const referral = await Referral.create({
    referrerId,
    referredId,
    merchantId,
    status: 'completed',
    referrerReward: { points: 100, awardedAt: new Date() },
    referredReward: { points: 50, awardedAt: new Date() }
  });

  // Award points to both
  await this.awardPoints(referrerId, 100, 'Referral bonus');
  await this.awardPoints(referredId, 50, 'Welcome bonus');

  // Update referrer count
  await User.findByIdAndUpdate(referrerId, { 
    $inc: { referralCount: 1 } 
  });
}
```

### 2.2 Auto-Apply Best Offer

**Files to Create/Modify:**
```
rez-merchant-service/
├── src/services/
│   └── offerOptimizer.ts          (NEW)
└── src/routes/
    └── checkout.ts                (MODIFY)
```

**Algorithm:**
```typescript
// services/offerOptimizer.ts
interface OfferOptimization {
  bestOffer: Offer | null;
  savings: number;
  message: string;
}

async function findBestOffer(
  userId: string,
  cartTotal: number,
  merchantId: string
): Promise<OfferOptimization> {
  const offers = await Offer.find({
    merchantId,
    validUntil: { $gte: new Date() },
    $or: [
      { userId: null },              // Public offers
      { userId: userId }             // Personal offers
    ]
  });

  let best: OfferOptimization = { 
    bestOffer: null, 
    savings: 0, 
    message: 'No offers available' 
  };

  for (const offer of offers) {
    // Check eligibility
    if (!await isEligible(userId, offer)) continue;
    
    // Check minimum order
    if (cartTotal < offer.minOrderValue) continue;
    
    // Calculate savings
    const savings = calculateSavings(cartTotal, offer);
    
    if (savings > best.savings) {
      best = {
        bestOffer: offer,
        savings,
        message: getOfferMessage(offer)
      };
    }
  }

  return best;
}
```

---

## PHASE 3: Karma Dashboard (Week 6-8)

### 3.1 Karma UI Components

**Files to Create:**
```
rez-karma-app/
├── src/app/karma/
│   ├── page.tsx                    (MODIFY - add dashboard)
│   ├── dashboard.tsx               (NEW)
│   ├── progress.tsx               (NEW)
│   ├── perks/
│   │   ├── page.tsx               (NEW)
│   │   └── [id].tsx               (NEW)
│   ├── missions/
│   │   ├── page.tsx               (NEW)
│   │   └── [id].tsx              (NEW)
│   └── achievements.tsx            (NEW)
├── src/components/
│   ├── KarmaCard.tsx              (NEW)
│   ├── LevelProgress.tsx           (NEW)
│   ├── PerkCard.tsx               (NEW)
│   ├── MissionCard.tsx             (NEW)
│   └── Badge.tsx                   (NEW)
└── src/services/
    └── karmaService.ts            (MODIFY)
```

**Dashboard Component:**
```typescript
// app/karma/dashboard.tsx
export default function KarmaDashboard() {
  const { data: karma } = useSWR('/karma/profile');
  
  return (
    <div className="p-4">
      {/* Karma Level Card */}
      <KarmaCard 
        level={karma.level}
        points={karma.currentPoints}
        nextLevel={karma.nextLevelPoints}
        progress={karma.progress}
      />
      
      {/* Level Progress */}
      <LevelProgress 
        tiers={karma.tiers}
        currentTier={karma.tier}
      />
      
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <StatCard 
          label="Missions" 
          value={karma.completedMissions} 
          icon="🎯"
        />
        <StatCard 
          label="Perks" 
          value={karma.redeemedPerks} 
          icon="🎁"
        />
        <StatCard 
          label="Badges" 
          value={karma.earnedBadges} 
          icon="🏆"
        />
      </div>
      
      {/* Available Perks */}
      <Section title="Available Perks">
        <div className="grid grid-cols-2 gap-3">
          {karma.availablePerks.map(perk => (
            <PerkCard key={perk.id} perk={perk} />
          ))}
        </div>
      </Section>
      
      {/* Daily Missions */}
      <Section title="Daily Missions">
        {karma.dailyMissions.map(mission => (
          <MissionCard key={mission.id} mission={mission} />
        ))}
      </Section>
      
      {/* Achievements */}
      <Section title="Achievements">
        <ScrollView horizontal>
          {karma.achievements.map(badge => (
            <Badge key={badge.id} badge={badge} />
          ))}
        </ScrollView>
      </Section>
    </div>
  );
}
```

### 3.2 Leaderboard

**API Endpoint:**
```typescript
// karma-service/src/routes/karmaRoutes.ts
router.get('/leaderboard', async (req, res) => {
  const { limit = 10, period = 'monthly' } = req.query;
  
  let dateFilter: Date;
  if (period === 'daily') {
    dateFilter = startOfDay(new Date());
  } else if (period === 'weekly') {
    dateFilter = startOfWeek(new Date());
  } else {
    dateFilter = startOfMonth(new Date());
  }
  
  const leaderboard = await KarmaProfile.aggregate([
    { $match: { updatedAt: { $gte: dateFilter } } },
    { $sort: { totalKarma: -1 } },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $project: {
        rank: { $index: 1 },
        userId: 1,
        'user.name': 1,
        'user.avatar': 1,
        totalKarma: 1,
        tier: 1
      }
    }
  ]);
  
  res.json({ leaderboard });
});
```

### 3.3 Streaks

**Schema Addition:**
```typescript
// In KarmaProfile.ts
@Prop({ type: StreakData })
streak: StreakData;

// New schema
@Schema()
export class StreakData {
  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  longestStreak: number;

  @Prop({ type: Date })
  lastActivityDate: Date;

  @Prop({ type: [Date] })
  activityHistory: Date[];  // Last 30 days
}
```

**Service:**
```typescript
async updateStreak(userId: string): Promise<StreakData> {
  const profile = await KarmaProfile.findOne({ userId });
  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);
  
  if (isSameDay(profile.streak.lastActivityDate, today)) {
    // Already logged today
    return profile.streak;
  }
  
  if (isSameDay(profile.streak.lastActivityDate, yesterday)) {
    // Continuing streak
    profile.streak.currentStreak += 1;
    profile.streak.longestStreak = Math.max(
      profile.streak.longestStreak,
      profile.streak.currentStreak
    );
  } else {
    // Streak broken
    profile.streak.currentStreak = 1;
  }
  
  profile.streak.lastActivityDate = today;
  profile.streak.activityHistory.push(today);
  
  // Keep only last 30 days
  profile.streak.activityHistory = profile.streak.activityHistory
    .slice(-30);
    
  await profile.save();
  return profile.streak;
}
```

---

## PHASE 4: Marketing Platform (Week 9-12)

### 4.1 WhatsApp Integration

**Files to Create:**
```
rez-marketing-backend/
├── src/channels/
│   └── whatsapp.ts                 (NEW)
├── src/services/
│   └── whatsappService.ts          (NEW)
└── src/routes/
    └── whatsapp.ts                 (NEW)
```

**Service:**
```typescript
// services/whatsappService.ts
import { Client, LocalAuth } from 'whatsapp-web.js';

export class WhatsAppService {
  private client: Client;
  
  async initialize() {
    this.client = new Client({
      authStrategy: new LocalAuth()
    });
    
    this.client.on('qr', (qr) => {
      // Emit QR for admin to scan
      eventEmitter.emit('whatsapp:qr', qr);
    });
    
    this.client.on('ready', () => {
      console.log('WhatsApp connected');
    });
  }
  
  async sendMessage(phone: string, template: string, params: object) {
    const message = this.interpolate(template, params);
    
    const chatId = `${phone}@c.us`;
    await this.client.sendMessage(chatId, message);
    
    // Log in database
    await WhatsAppLog.create({
      phone,
      template,
      message,
      sentAt: new Date()
    });
  }
  
  async sendTemplateMessage(
    phone: string, 
    templateId: string,
    components: TemplateComponent[]
  ) {
    // Use WhatsApp Business API
    const response = await fetch(WABA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: templateId,
          language: { code: 'en' },
          components
        }
      })
    });
    
    return response.json();
  }
}
```

### 4.2 Drag-Drop Campaign Builder

**Files to Create:**
```
rez-marketing-frontend/
├── src/app/campaigns/
│   ├── builder.tsx                 (NEW)
│   ├── components/
│   │   ├── DragDropCanvas.tsx     (NEW)
│   │   ├── BlockPalette.tsx       (NEW)
│   │   ├── blocks/
│   │   │   ├── TextBlock.tsx      (NEW)
│   │   │   ├── ImageBlock.tsx     (NEW)
│   │   │   ├── ButtonBlock.tsx     (NEW)
│   │   │   ├── DividerBlock.tsx   (NEW)
│   │   │   └── SpacerBlock.tsx     (NEW)
│   │   └── PropertiesPanel.tsx    (NEW)
│   └── utils/
│       └── canvasSerializer.ts      (NEW)
```

**Drag-Drop Implementation:**
```typescript
// components/DragDropCanvas.tsx
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function DragDropCanvas({ 
  blocks, 
  onBlocksChange 
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={blocks.map(b => b.id)}
        strategy={verticalListSortingStrategy}
      >
        {blocks.map(block => (
          <SortableBlock key={block.id} block={block} />
        ))}
      </SortableContext>
      
      <DragOverlay>
        {activeId ? (
          <BlockPreview block={blocks.find(b => b.id === activeId)} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
  
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      
      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      onBlocksChange(newBlocks);
    }
    
    setActiveId(null);
  }
}
```

### 4.3 Automation Flows

**Files to Create:**
```
rez-marketing-backend/
├── src/services/
│   ├── automationEngine.ts          (NEW)
│   └── flowBuilder.ts               (NEW)
└── src/models/
    └── AutomationFlow.ts            (NEW)
```

**Flow Schema:**
```typescript
// models/AutomationFlow.ts
@Schema()
export class AutomationFlow {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  trigger: {
    type: 'event' | 'schedule' | 'segment';
    event?: string;              // 'order.placed', 'user.signup'
    schedule?: CronExpression;
    segment?: string;
  };

  @Prop({ type: [FlowNode], required: true })
  nodes: FlowNode[];

  @Prop({ default: 'draft' })
  status: 'draft' | 'active' | 'paused';

  @Prop({ type: Date })
  startedAt: Date;
}

@Schema()
export class FlowNode {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  type: 'trigger' | 'action' | 'condition' | 'delay';

  @Prop({ required: true })
  position: { x: number; y: number };

  @Prop({ type: Object })
  data: TriggerData | ActionData | ConditionData | DelayData;

  @Prop({ type: [String] })
  connections: string[];           // Node IDs
}

// Example flow: Abandoned Cart
const abandonedCartFlow = {
  name: 'Abandoned Cart Reminder',
  trigger: {
    type: 'event',
    event: 'cart.abandoned'
  },
  nodes: [
    {
      id: 'trigger',
      type: 'trigger',
      data: { event: 'cart.abandoned' }
    },
    {
      id: 'wait-1hr',
      type: 'delay',
      data: { delay: '1h' }
    },
    {
      id: 'check-cart',
      type: 'condition',
      data: { 
        condition: 'cart_exists',
        then: 'send-reminder',
        else: 'end'
      }
    },
    {
      id: 'send-reminder',
      type: 'action',
      data: { 
        action: 'send_email',
        template: 'abandoned-cart-reminder'
      }
    },
    {
      id: 'wait-24hr',
      type: 'delay',
      data: { delay: '24h' }
    },
    {
      id: 'send-offer',
      type: 'action',
      data: { 
        action: 'send_push',
        message: '🎁 Here\'s 10% off to complete your order!'
      }
    }
  ]
};
```

---

## PHASE 5: Additional Features

### 5.1 Item Add-ons/Customizations

**Files to Modify:**
```
rez-merchant-service/
├── src/models/
│   └── Product.ts                  (MODIFY)
└── src/routes/
    └── menu.ts                      (MODIFY)
```

**Schema:**
```typescript
// Add to Product schema
@Prop({ type: [ModifierGroup] })
modifierGroups: ModifierGroup[];

@Schema()
export class ModifierGroup {
  @Prop({ required: true })
  name: string;                     // "Size", "Toppings", "Extras"

  @Prop({ required: true })
  minSelections: number;            // 0 = optional, 1+ = required

  @Prop({ required: true })
  maxSelections: number;             // Max choices allowed

  @Prop({ type: [Modifier], required: true })
  modifiers: Modifier[];
}

@Schema()
export class Modifier {
  @Prop({ required: true })
  name: string;                     // "Large", "Extra Cheese"

  @Prop({ required: true })
  price: number;                     // Additional price

  @Prop({ default: true })
  available: boolean;
}
```

### 5.2 Multi-Location Management

**Files to Create:**
```
rez-merchant-service/
├── src/routes/
│   └── locations.ts                (NEW)
├── src/services/
│   └── locationService.ts          (NEW)
└── src/models/
    └── Location.ts                   (NEW)
```

**Schema:**
```typescript
@Schema()
export class Location {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: Address;

  @Prop({ required: true })
  phone: string;

  @Prop({ type: Number })
  latitude: number;

  @Prop({ type: Number })
  longitude: number;

  @Prop({ type: [MenuItemAvailability] })
  menuAvailability: MenuItemAvailability[];

  @Prop({ type: OperatingHours, required: true })
  hours: OperatingHours;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String] })
  managers: Types.ObjectId[];        // User IDs
}
```

---

## TIMELINE

| Phase | Features | Duration | Start | End |
|-------|----------|----------|-------|-----|
| 1 | Consumer App | 2 weeks | Week 1 | Week 2 |
| 2 | Loyalty | 3 weeks | Week 3 | Week 5 |
| 3 | Karma | 3 weeks | Week 6 | Week 8 |
| 4 | Marketing | 4 weeks | Week 9 | Week 12 |
| 5 | Add-ons + Multi-loc | 4 weeks | Week 13 | Week 16 |

**Total: 16 weeks (4 months)**

---

## RESOURCE REQUIREMENTS

| Role | Phases | Allocation |
|------|--------|------------|
| Frontend Dev | 1, 3, 4 | 100% |
| Backend Dev | 2, 4, 5 | 100% |
| Designer | 1, 3 | 50% |
| QA | All | 50% |

---

**Document:** BUILD_PLAN_2026.md
**Version:** 1.0
**Created:** May 8, 2026
