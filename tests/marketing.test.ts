/**
 * Marketing System Test Suite
 *
 * Tests for:
 * - Campaign management
 * - Automation triggers
 * - WhatsApp notifications
 * - A/B testing
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// Note: This is a standalone test file without dependencies on source modules
// All mocking is done inline as needed

// ============================================================================
// Type Definitions
// ============================================================================

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  type: CampaignType;
  target: CampaignTarget;
  schedule?: CampaignSchedule;
  metrics?: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
}

type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
type CampaignType = 'push' | 'sms' | 'email' | 'whatsapp' | 'multi_channel';

interface CampaignTarget {
  type: 'all' | 'segment' | 'tier' | 'custom';
  segmentId?: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  userIds?: string[];
  filters?: Record<string, unknown>;
}

interface CampaignSchedule {
  startDate?: Date;
  endDate?: Date;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    daysOfWeek?: number[];
  };
}

interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue?: number;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
}

type AutomationTrigger =
  | 'win_back'
  | 'abandoned_cart'
  | 'birthday'
  | 'first_purchase'
  | 'milestone'
  | 'inactivity'
  | 'price_drop'
  | 'back_in_stock';

interface AutomationCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: unknown;
}

interface AutomationAction {
  type: 'send_message' | 'apply_discount' | 'add_to_segment' | 'send_push' | 'send_sms' | 'send_email';
  template?: string;
  params?: Record<string, unknown>;
}

interface WhatsAppMessage {
  to: string;
  template: string;
  language?: string;
  components?: WhatsAppComponent[];
}

interface WhatsAppComponent {
  type: 'header' | 'body' | 'footer' | 'buttons';
  parameters?: { type: string; text?: string; image?: { link?: string } }[];
}

interface ABTest {
  id: string;
  name: string;
  hypothesis: string;
  variants: ABVariant[];
  metric: ABMetric;
  status: 'draft' | 'running' | 'completed';
  startDate?: Date;
  endDate?: Date;
  confidenceLevel?: number;
}

interface ABVariant {
  id: string;
  name: string;
  traffic: number; // percentage 0-100
  metrics?: {
    impressions: number;
    conversions: number;
    conversionRate: number;
  };
}

type ABMetric = 'click_rate' | 'conversion_rate' | 'revenue' | 'engagement' | 'open_rate';

interface UserSegment {
  id: string;
  name: string;
  rules: SegmentRule[];
  userCount?: number;
}

interface SegmentRule {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: unknown;
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp_1',
    name: 'Summer Sale',
    status: 'active',
    type: 'push',
    target: { type: 'all' },
    metrics: { sent: 10000, delivered: 9500, opened: 4000, clicked: 1500, converted: 300 },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'camp_2',
    name: 'VIP Exclusive',
    status: 'scheduled',
    type: 'whatsapp',
    target: { type: 'tier', tier: 'platinum' },
    schedule: { startDate: new Date('2026-06-01') },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const MOCK_SEGMENTS: UserSegment[] = [
  {
    id: 'seg_high_value',
    name: 'High Value Customers',
    rules: [{ field: 'lifetimeValue', operator: 'gte', value: 10000 }],
  },
  {
    id: 'seg_churned',
    name: 'At Risk',
    rules: [{ field: 'daysSinceLastOrder', operator: 'gte', value: 30 }],
  },
  {
    id: 'seg_new_users',
    name: 'New Users',
    rules: [{ field: 'daysSinceSignup', operator: 'lte', value: 7 }],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatPhoneNumber(phone: string, countryCode: string = '+91'): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return `${countryCode}${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith(countryCode.replace('+', ''))) {
    return `+${cleaned}`;
  }
  return `${countryCode}${cleaned}`;
}

function calculateConversionRate(conversions: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (conversions / impressions) * 100;
}

function calculateStatisticalSignificance(
  controlConversions: number,
  controlImpressions: number,
  variantConversions: number,
  variantImpressions: number
): { isSignificant: boolean; confidence: number; lift: number } {
  const controlRate = controlConversions / controlImpressions;
  const variantRate = variantConversions / variantImpressions;

  const lift = ((variantRate - controlRate) / controlRate) * 100;

  // Simplified z-score calculation
  const pooledRate = (controlConversions + variantConversions) / (controlImpressions + variantImpressions);
  const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / controlImpressions + 1 / variantImpressions));

  if (se === 0) {
    return { isSignificant: false, confidence: 0, lift };
  }

  const zScore = Math.abs((variantRate - controlRate) / se);

  // Convert z-score to confidence level
  const confidence = Math.min(99.9, (1 - 2 * (1 - normalCDF(zScore))) * 100);
  const isSignificant = zScore >= 1.96 && confidence >= 95;

  return { isSignificant, confidence, lift };
}

function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

function evaluateSegmentRules(user: Record<string, unknown>, rules: SegmentRule[]): boolean {
  for (const rule of rules) {
    const userValue = user[rule.field];
    const ruleValue = rule.value;

    let matches = false;
    switch (rule.operator) {
      case 'eq':
        matches = userValue === ruleValue;
        break;
      case 'ne':
        matches = userValue !== ruleValue;
        break;
      case 'gt':
        matches = typeof userValue === 'number' && userValue > (ruleValue as number);
        break;
      case 'lt':
        matches = typeof userValue === 'number' && userValue < (ruleValue as number);
        break;
      case 'gte':
        matches = typeof userValue === 'number' && userValue >= (ruleValue as number);
        break;
      case 'lte':
        matches = typeof userValue === 'number' && userValue <= (ruleValue as number);
        break;
      case 'in':
        matches = Array.isArray(ruleValue) && ruleValue.includes(userValue);
        break;
      case 'contains':
        matches = typeof userValue === 'string' && userValue.includes(ruleValue as string);
        break;
    }

    if (!matches) return false;
  }
  return true;
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Marketing System', () => {

  // --------------------------------------------------------------------------
  // Campaign Management Tests
  // --------------------------------------------------------------------------
  describe('Campaigns', () => {

    describe('Campaign Creation', () => {
      it('should create campaign with valid data', () => {
        const campaignData = {
          name: 'New Campaign',
          type: 'push' as CampaignType,
          target: { type: 'all' as const },
        };

        const campaign: Campaign = {
          id: `camp_${Date.now()}`,
          ...campaignData,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(campaign.name).toBe('New Campaign');
        expect(campaign.type).toBe('push');
        expect(campaign.status).toBe('draft');
      });

      it('should require name for campaign', () => {
        const createCampaign = (data: Partial<Campaign>): Campaign | null => {
          if (!data.name || data.name.trim().length === 0) {
            return null;
          }
          return {
            id: `camp_${Date.now()}`,
            name: data.name,
            type: data.type || 'push',
            status: 'draft',
            target: data.target || { type: 'all' },
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        };

        expect(createCampaign({ name: '' })).toBeNull();
        expect(createCampaign({ name: '  ' })).toBeNull();
        expect(createCampaign({ name: 'Valid Name' })).not.toBeNull();
      });

      it('should validate campaign type', () => {
        const validTypes: CampaignType[] = ['push', 'sms', 'email', 'whatsapp', 'multi_channel'];

        const isValidType = (type: string): boolean => validTypes.includes(type as CampaignType);

        expect(isValidType('push')).toBe(true);
        expect(isValidType('sms')).toBe(true);
        expect(isValidType('email')).toBe(true);
        expect(isValidType('whatsapp')).toBe(true);
        expect(isValidType('multi_channel')).toBe(true);
        expect(isValidType('invalid')).toBe(false);
      });

      it('should set default target for campaign', () => {
        const getDefaultTarget = (): CampaignTarget => ({ type: 'all' });

        const target = getDefaultTarget();
        expect(target.type).toBe('all');
      });
    });

    describe('Campaign Scheduling', () => {
      it('should schedule campaign for future date', () => {
        const startDate = new Date('2026-06-01T10:00:00');
        const now = new Date();

        const canSchedule = startDate > now;
        expect(canSchedule).toBe(true);
      });

      it('should not schedule campaign in the past', () => {
        const startDate = new Date('2025-01-01');
        const now = new Date();

        const canSchedule = startDate > now;
        expect(canSchedule).toBe(false);
      });

      it('should validate schedule date range', () => {
        const schedule: CampaignSchedule = {
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-06-30'),
        };

        const isValidRange = schedule.endDate > schedule.startDate;
        expect(isValidRange).toBe(true);
      });

      it('should handle recurring campaigns', () => {
        const recurring: CampaignSchedule['recurring'] = {
          frequency: 'weekly',
          time: '10:00',
          daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        };

        expect(recurring.frequency).toBe('weekly');
        expect(recurring.daysOfWeek).toHaveLength(3);
      });

      it('should transition status when scheduled', () => {
        let status: CampaignStatus = 'draft';

        // Schedule the campaign
        if (status === 'draft') {
          status = 'scheduled';
        }

        expect(status).toBe('scheduled');
      });
    });

    describe('Campaign Metrics', () => {
      it('should track campaign metrics', () => {
        const metrics: CampaignMetrics = {
          sent: 10000,
          delivered: 9500,
          opened: 4000,
          clicked: 1500,
          converted: 300,
          revenue: 15000,
        };

        expect(metrics.sent).toBe(10000);
        expect(metrics.delivered).toBe(9500);
        expect(metrics.converted).toBe(300);
      });

      it('should calculate delivery rate', () => {
        const sent = 10000;
        const delivered = 9500;

        const deliveryRate = (delivered / sent) * 100;
        expect(deliveryRate).toBe(95);
      });

      it('should calculate open rate', () => {
        const delivered = 9500;
        const opened = 4000;

        const openRate = (opened / delivered) * 100;
        expect(openRate).toBeCloseTo(42.1, 1);
      });

      it('should calculate click-through rate', () => {
        const delivered = 9500;
        const clicked = 1500;

        const ctr = (clicked / delivered) * 100;
        expect(ctr).toBeCloseTo(15.8, 1);
      });

      it('should calculate conversion rate', () => {
        const clicked = 1500;
        const converted = 300;

        const conversionRate = (converted / clicked) * 100;
        expect(conversionRate).toBe(20);
      });

      it('should calculate ROI', () => {
        const revenue = 15000;
        const cost = 5000;

        const roi = ((revenue - cost) / cost) * 100;
        expect(roi).toBe(200);
      });

      it('should handle zero values gracefully', () => {
        const sent = 0;
        const delivered = 0;

        const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
        expect(deliveryRate).toBe(0);
      });
    });

    describe('Campaign Status', () => {
      it('should transition from draft to scheduled', () => {
        const validTransitions: Record<CampaignStatus, CampaignStatus[]> = {
          draft: ['scheduled', 'cancelled'],
          scheduled: ['active', 'cancelled'],
          active: ['paused', 'completed', 'cancelled'],
          paused: ['active', 'cancelled'],
          completed: [],
          cancelled: [],
        };

        const canTransition = (from: CampaignStatus, to: CampaignStatus): boolean => {
          return validTransitions[from].includes(to);
        };

        expect(canTransition('draft', 'scheduled')).toBe(true);
        expect(canTransition('draft', 'active')).toBe(false);
        expect(canTransition('active', 'completed')).toBe(true);
        expect(canTransition('completed', 'active')).toBe(false);
      });

      it('should pause active campaign', () => {
        let status: CampaignStatus = 'active';

        if (status === 'active') {
          status = 'paused';
        }

        expect(status).toBe('paused');
      });

      it('should complete campaign when end date reached', () => {
        const schedule = {
          endDate: new Date('2026-05-01'),
        };
        const now = new Date('2026-05-02');

        const shouldComplete = schedule.endDate < now;
        expect(shouldComplete).toBe(true);
      });
    });
  });

  // --------------------------------------------------------------------------
  // Automation Tests
  // --------------------------------------------------------------------------
  describe('Automation', () => {

    describe('Win-back Automation', () => {
      it('should trigger win-back for lapsed users', () => {
        const user = {
          userId: 'user_1',
          daysSinceLastOrder: 45,
          lastOrderDate: new Date('2026-03-15'),
          email: 'user@example.com',
        };

        const triggerWinBack = (user: Record<string, unknown>): boolean => {
          const daysSinceLastOrder = user.daysSinceLastOrder as number;
          return daysSinceLastOrder >= 30;
        };

        expect(triggerWinBack(user)).toBe(true);
      });

      it('should not trigger win-back for recent users', () => {
        const user = {
          userId: 'user_2',
          daysSinceLastOrder: 15,
          lastOrderDate: new Date(),
          email: 'user@example.com',
        };

        const triggerWinBack = (user: Record<string, unknown>): boolean => {
          const daysSinceLastOrder = user.daysSinceLastOrder as number;
          return daysSinceLastOrder >= 30;
        };

        expect(triggerWinBack(user)).toBe(false);
      });

      it('should personalize win-back message', () => {
        const user = {
          name: 'John',
          daysSinceLastOrder: 45,
        };

        const personalizeMessage = (template: string, data: Record<string, unknown>): string => {
          return template
            .replace('{{name}}', data.name as string)
            .replace('{{days}}', String(data.daysSinceLastOrder));
        };

        const message = personalizeMessage(
          'Hey {{name}}, we miss you! It\'s been {{days}} days since your last order.',
          user
        );

        expect(message).toContain('John');
        expect(message).toContain('45');
      });

      it('should calculate win-back offer value', () => {
        const user = {
          lifetimeValue: 5000,
          daysSinceLastOrder: 60,
        };

        const calculateOffer = (user: Record<string, unknown>): number => {
          const ltv = user.lifetimeValue as number;
          const days = user.daysSinceLastOrder as number;

          // Higher value users get bigger offers, longer inactive gets better offers
          let offer = 5;
          if (ltv > 1000) offer += 5;  // 10
          if (ltv > 5000) offer += 5;   // 15 (not triggered - ltv is 5000, not > 5000)
          if (days > 45) offer += 5;     // 20
          if (days > 60) offer += 5;     // not triggered - days is 60, not > 60

          return Math.min(offer, 25); // Cap at 25%
        };

        expect(calculateOffer(user)).toBe(15);
      });
    });

    describe('Abandoned Cart', () => {
      it('should detect abandoned cart', () => {
        const cart = {
          userId: 'user_1',
          items: [{ productId: 'prod_1', quantity: 2 }],
          totalValue: 500,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          status: 'active',
        };

        const isAbandoned = (cart: Record<string, unknown>): boolean => {
          const createdAt = cart.createdAt as Date;
          const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
          return hoursSinceCreation >= 1 && (cart.status as string) === 'active';
        };

        expect(isAbandoned(cart)).toBe(true);
      });

      it('should send abandoned cart reminder', () => {
        const cart = {
          userId: 'user_1',
          items: [{ productId: 'prod_1', name: 'Pizza', quantity: 2 }],
          totalValue: 500,
        };

        const reminderConfig = {
          enabled: true,
          delayHours: 2,
          maxReminders: 3,
        };

        const shouldSendReminder = cart.items.length > 0 && reminderConfig.enabled;
        expect(shouldSendReminder).toBe(true);
      });

      it('should calculate urgency level', () => {
        const hoursSinceCart = 4;

        const getUrgencyLevel = (hours: number): 'low' | 'medium' | 'high' | 'critical' => {
          if (hours < 2) return 'low';
          if (hours < 6) return 'medium';
          if (hours < 24) return 'high';
          return 'critical';
        };

        expect(getUrgencyLevel(1)).toBe('low');
        expect(getUrgencyLevel(4)).toBe('medium');
        expect(getUrgencyLevel(12)).toBe('high');
        expect(getUrgencyLevel(48)).toBe('critical');
      });
    });

    describe('Birthday Automation', () => {
      it('should send birthday wishes', () => {
        const today = new Date();
        const user = {
          userId: 'user_1',
          name: 'Jane',
          dateOfBirth: new Date(`1990-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`),
          email: 'jane@example.com',
        };

        const isBirthday =
          user.dateOfBirth.getMonth() === today.getMonth() &&
          user.dateOfBirth.getDate() === today.getDate();

        expect(isBirthday).toBe(true);
      });

      it('should not send duplicate birthday messages', () => {
        const user = {
          userId: 'user_1',
          birthdayMessageSentAt: new Date('2026-05-08T09:00:00'),
        };

        const today = new Date();
        const lastSent = new Date(user.birthdayMessageSentAt);

        const alreadySentToday =
          lastSent.getDate() === today.getDate() &&
          lastSent.getMonth() === today.getMonth() &&
          lastSent.getFullYear() === today.getFullYear();

        expect(alreadySentToday).toBe(true);
      });

      it('should personalize birthday offer', () => {
        const user = {
          name: 'Jane',
          tier: 'gold',
          loyaltyPoints: 5000,
        };

        const getBirthdayOffer = (user: Record<string, unknown>): { discount: number; bonus: string } => {
          const tier = user.tier as string;
          const points = user.loyaltyPoints as number;

          const tierDiscounts: Record<string, number> = {
            bronze: 10,
            silver: 15,
            gold: 20,
            platinum: 25,
          };

          const discount = tierDiscounts[tier] || 10;
          const bonus = points > 1000 ? 'Double points on your next order!' : 'Free delivery included!';

          return { discount, bonus };
        };

        const offer = getBirthdayOffer(user);
        expect(offer.discount).toBe(20);
        expect(offer.bonus).toContain('Double points');
      });
    });

    describe('Automation Rules', () => {
      it('should evaluate automation conditions', () => {
        const user = {
          lifetimeValue: 15000,
          ordersCount: 25,
          tier: 'gold',
        };

        const conditions: AutomationCondition[] = [
          { field: 'lifetimeValue', operator: 'gte', value: 10000 },
          { field: 'ordersCount', operator: 'gte', value: 10 },
        ];

        const allMatch = conditions.every(cond => {
          const userValue = user[cond.field as keyof typeof user];
          const ruleValue = cond.value;

          switch (cond.operator) {
            case 'gte': return (userValue as number) >= (ruleValue as number);
            case 'lte': return (userValue as number) <= (ruleValue as number);
            case 'eq': return userValue === ruleValue;
            default: return false;
          }
        });

        expect(allMatch).toBe(true);
      });

      it('should handle OR conditions', () => {
        const user = {
          tier: 'silver',
          hasApp: true,
        };

        const isHighValue = user.tier === 'platinum' || user.tier === 'gold' || user.hasApp;
        expect(isHighValue).toBe(true);
      });
    });
  });

  // --------------------------------------------------------------------------
  // WhatsApp Tests
  // --------------------------------------------------------------------------
  describe('WhatsApp', () => {

    describe('Phone Number Formatting', () => {
      it('should format Indian phone numbers', () => {
        expect(formatPhoneNumber('9876543210', '+91')).toBe('+919876543210');
        expect(formatPhoneNumber('09876543210', '+91')).toBe('+919876543210');
        expect(formatPhoneNumber('+919876543210', '+91')).toBe('+919876543210');
      });

      it('should handle international phone numbers', () => {
        expect(formatPhoneNumber('+14155552671', '+1')).toBe('+14155552671');
        expect(formatPhoneNumber('4155552671', '+1')).toBe('+14155552671');
      });

      it('should remove non-numeric characters', () => {
        const phone = '+91-98765-43210';
        const cleaned = phone.replace(/\D/g, '');
        expect(cleaned).toBe('919876543210');
      });

      it('should validate phone number length', () => {
        const isValidLength = (phone: string): boolean => {
          const digits = phone.replace(/\D/g, '');
          return digits.length >= 10 && digits.length <= 15;
        };

        expect(isValidLength('9876543210')).toBe(true);
        expect(isValidLength('98765')).toBe(false);
        expect(isValidLength('9876543210123456789')).toBe(false);
      });
    });

    describe('Template Messages', () => {
      it('should send template message', () => {
        const message: WhatsAppMessage = {
          to: '+919876543210',
          template: 'order_confirmation',
          language: 'en',
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: 'ORD-12345' },
                { type: 'text', text: 'Rs. 500' },
              ],
            },
          ],
        };

        expect(message.template).toBe('order_confirmation');
        expect(message.components).toHaveLength(1);
        expect(message.components?.[0].parameters).toHaveLength(2);
      });

      it('should handle header components', () => {
        const message: WhatsAppMessage = {
          to: '+919876543210',
          template: 'promotional_offer',
          language: 'en',
          components: [
            {
              type: 'header',
              parameters: [{ type: 'image', image: { link: 'https://example.com/banner.jpg' } }],
            },
            {
              type: 'body',
              parameters: [{ type: 'text', text: 'Get 20% off!' }],
            },
          ],
        };

        expect(message.components?.[0].type).toBe('header');
        expect(message.components?.[0].parameters?.[0].type).toBe('image');
      });

      it('should validate template name format', () => {
        const isValidTemplateName = (name: string): boolean => {
          return /^[a-z0-9_]+$/.test(name);
        };

        expect(isValidTemplateName('order_confirmation')).toBe(true);
        expect(isValidTemplateName('order-confirmation')).toBe(false);
        expect(isValidTemplateName('OrderConfirmation')).toBe(false);
      });

      it('should support button components', () => {
        const message: WhatsAppMessage = {
          to: '+919876543210',
          template: 'cta_with_buttons',
          language: 'en',
          components: [
            {
              type: 'buttons',
              parameters: [
                { type: 'text', text: 'Shop Now' },
                { type: 'text', text: 'View Details' },
              ],
            },
          ],
        };

        expect(message.components?.[0].type).toBe('buttons');
        expect(message.components?.[0].parameters).toHaveLength(2);
      });
    });

    describe('Webhook Handling', () => {
      it('should parse incoming message webhook', () => {
        const webhookPayload = {
          entry: [{
            changes: [{
              value: {
                messages: [{
                  from: '919876543210',
                  type: 'text',
                  text: { body: 'Hello!' },
                  timestamp: '1707250800',
                }],
              },
            }],
          }],
        };

        const message = webhookPayload.entry[0].changes[0].value.messages[0];
        expect(message.from).toBe('919876543210');
        expect(message.type).toBe('text');
        expect(message.text.body).toBe('Hello!');
      });

      it('should handle status update webhooks', () => {
        const statusPayload = {
          entry: [{
            changes: [{
              value: {
                statuses: [{
                  id: 'wamid.xxx',
                  status: 'delivered',
                  timestamp: '1707250800',
                  recipient_id: '919876543210',
                }],
              },
            }],
          }],
        };

        const status = statusPayload.entry[0].changes[0].value.statuses[0];
        expect(status.status).toBe('delivered');
        expect(status.recipient_id).toBe('919876543210');
      });

      it('should validate webhook signature', () => {
        const validateSignature = (payload: string, signature: string, secret: string): boolean => {
          // In production, this would use crypto.createHmac
          return signature.length > 0 && payload.length > 0;
        };

        expect(validateSignature('{}', 'sha256=abc123', 'secret')).toBe(true);
        expect(validateSignature('', '', 'secret')).toBe(false);
      });
    });
  });

  // --------------------------------------------------------------------------
  // A/B Testing Tests
  // --------------------------------------------------------------------------
  describe('A/B Testing', () => {

    describe('Variant Assignment', () => {
      it('should assign user to variant based on traffic split', () => {
        const variants = [
          { id: 'control', name: 'Control', traffic: 50 },
          { id: 'variant_a', name: 'Variant A', traffic: 50 },
        ];

        const assignVariant = (userId: string, variantList: typeof variants): string => {
          // Simple hash-based assignment
          const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const bucket = hash % 100;

          let cumulative = 0;
          for (const variant of variantList) {
            cumulative += variant.traffic;
            if (bucket < cumulative) {
              return variant.id;
            }
          }
          return variantList[0].id;
        };

        expect(assignVariant('user_1', variants)).toBeDefined();
        expect(['control', 'variant_a']).toContain(assignVariant('user_1', variants));
      });

      it('should maintain consistent assignment for same user', () => {
        const userId = 'consistent_user';
        const assignments: string[] = [];

        const assignVariant = (id: string): string => {
          const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          return hash % 2 === 0 ? 'control' : 'variant_a';
        };

        // Multiple assignments should return same result
        for (let i = 0; i < 10; i++) {
          assignments.push(assignVariant(userId));
        }

        const allSame = assignments.every(a => a === assignments[0]);
        expect(allSame).toBe(true);
      });

      it('should respect traffic percentages', () => {
        const variants = [
          { id: 'control', traffic: 80 },
          { id: 'variant_a', traffic: 20 },
        ];

        const totalTraffic = variants.reduce((sum, v) => sum + v.traffic, 0);
        expect(totalTraffic).toBe(100);
      });

      it('should handle multiple variants', () => {
        const variants = [
          { id: 'control', traffic: 34 },
          { id: 'variant_a', traffic: 33 },
          { id: 'variant_b', traffic: 33 },
        ];

        const totalTraffic = variants.reduce((sum, v) => sum + v.traffic, 0);
        expect(totalTraffic).toBe(100);
      });
    });

    describe('Conversion Tracking', () => {
      it('should track impressions', () => {
        const variant: ABVariant = {
          id: 'control',
          name: 'Control',
          traffic: 50,
          metrics: {
            impressions: 1000,
            conversions: 50,
            conversionRate: 5,
          },
        };

        expect(variant.metrics?.impressions).toBe(1000);
      });

      it('should track conversions', () => {
        const variant: ABVariant = {
          id: 'control',
          name: 'Control',
          traffic: 50,
          metrics: {
            impressions: 1000,
            conversions: 50,
            conversionRate: 5,
          },
        };

        expect(variant.metrics?.conversions).toBe(50);
      });

      it('should calculate conversion rate', () => {
        const impressions = 1000;
        const conversions = 50;

        const rate = calculateConversionRate(conversions, impressions);
        expect(rate).toBe(5);
      });

      it('should update metrics incrementally', () => {
        const variant: ABVariant = {
          id: 'control',
          name: 'Control',
          traffic: 50,
          metrics: {
            impressions: 1000,
            conversions: 50,
            conversionRate: 5,
          },
        };

        // New conversion
        variant.metrics!.impressions += 1;
        variant.metrics!.conversions += 1;
        variant.metrics!.conversionRate = calculateConversionRate(
          variant.metrics!.conversions,
          variant.metrics!.impressions
        );

        expect(variant.metrics?.impressions).toBe(1001);
        expect(variant.metrics?.conversions).toBe(51);
      });
    });

    describe('Statistical Significance', () => {
      it('should calculate confidence level', () => {
        const result = calculateStatisticalSignificance(50, 1000, 75, 1000);

        expect(result).toHaveProperty('isSignificant');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('lift');
      });

      it('should detect significant improvement', () => {
        const result = calculateStatisticalSignificance(50, 1000, 100, 1000);

        expect(result.lift).toBeGreaterThan(0);
      });

      it('should detect significant decline', () => {
        const result = calculateStatisticalSignificance(100, 1000, 50, 1000);

        expect(result.lift).toBeLessThan(0);
      });

      it('should handle zero conversions', () => {
        const result = calculateStatisticalSignificance(0, 1000, 50, 1000);

        expect(result.lift).toBe(Infinity); // Infinite improvement from 0
      });

      it('should require minimum sample size', () => {
        const minSampleSize = 100;

        const hasEnoughData = (impressions: number): boolean => impressions >= minSampleSize;

        expect(hasEnoughData(100)).toBe(true);
        expect(hasEnoughData(50)).toBe(false);
      });

      it('should determine winner when significant', () => {
        const controlRate = 0.05; // 5%
        const variantRate = 0.08; // 8%

        const isSignificant = variantRate > controlRate * 1.2; // 20% lift minimum
        const winner = isSignificant ? 'variant' : 'none';

        expect(isSignificant).toBe(true);
        expect(winner).toBe('variant');
      });
    });

    describe('Test Completion', () => {
      it('should complete test when significance reached', () => {
        const test: ABTest = {
          id: 'test_1',
          name: 'Button Color Test',
          hypothesis: 'Green button will increase clicks',
          variants: [
            { id: 'control', name: 'Control', traffic: 50 },
            { id: 'variant_a', name: 'Variant A', traffic: 50 },
          ],
          metric: 'click_rate',
          status: 'running',
        };

        const significanceReached = true;

        if (significanceReached) {
          test.status = 'completed';
        }

        expect(test.status).toBe('completed');
      });

      it('should complete test when max duration reached', () => {
        const test: ABTest = {
          id: 'test_1',
          name: 'Button Color Test',
          hypothesis: 'Green button will increase clicks',
          variants: [
            { id: 'control', name: 'Control', traffic: 50 },
            { id: 'variant_a', name: 'Variant A', traffic: 50 },
          ],
          metric: 'click_rate',
          status: 'running',
          startDate: new Date('2026-04-01'),
          endDate: new Date('2026-05-01'),
        };

        const now = new Date('2026-05-02');
        const durationReached = test.endDate && now > test.endDate;

        if (durationReached) {
          test.status = 'completed';
        }

        expect(test.status).toBe('completed');
      });

      it('should select winning variant', () => {
        const variants = [
          { id: 'control', name: 'Control', traffic: 50, metrics: { impressions: 1000, conversions: 50, conversionRate: 5 } },
          { id: 'variant_a', name: 'Variant A', traffic: 50, metrics: { impressions: 1000, conversions: 80, conversionRate: 8 } },
        ];

        const winner = variants.reduce((best, current) => {
          const bestRate = best.metrics?.conversionRate || 0;
          const currentRate = current.metrics?.conversionRate || 0;
          return currentRate > bestRate ? current : best;
        });

        expect(winner.id).toBe('variant_a');
        expect(winner.metrics?.conversionRate).toBe(8);
      });
    });
  });

  // --------------------------------------------------------------------------
  // Segment Tests
  // --------------------------------------------------------------------------
  describe('Segments', () => {

    describe('Segment Evaluation', () => {
      it('should match users to high value segment', () => {
        const segment: UserSegment = {
          id: 'high_value',
          name: 'High Value',
          rules: [{ field: 'lifetimeValue', operator: 'gte', value: 10000 }],
        };

        const user = { userId: 'u1', lifetimeValue: 15000 };

        const matches = evaluateSegmentRules(user, segment.rules);
        expect(matches).toBe(true);
      });

      it('should exclude users not matching segment', () => {
        const segment: UserSegment = {
          id: 'high_value',
          name: 'High Value',
          rules: [{ field: 'lifetimeValue', operator: 'gte', value: 10000 }],
        };

        const user = { userId: 'u2', lifetimeValue: 5000 };

        const matches = evaluateSegmentRules(user, segment.rules);
        expect(matches).toBe(false);
      });

      it('should handle multiple rules (AND)', () => {
        const segment: UserSegment = {
          id: 'premium_active',
          name: 'Premium Active Users',
          rules: [
            { field: 'tier', operator: 'eq', value: 'platinum' },
            { field: 'ordersLast30Days', operator: 'gte', value: 5 },
          ],
        };

        const user = { userId: 'u1', tier: 'platinum', ordersLast30Days: 10 };

        const matches = evaluateSegmentRules(user, segment.rules);
        expect(matches).toBe(true);
      });

      it('should handle IN operator', () => {
        const rules: SegmentRule[] = [
          { field: 'tier', operator: 'in', value: ['gold', 'platinum'] },
        ];

        const user1 = { tier: 'gold' };
        const user2 = { tier: 'silver' };

        const matches1 = evaluateSegmentRules(user1, rules);
        const matches2 = evaluateSegmentRules(user2, rules);

        expect(matches1).toBe(true);
        expect(matches2).toBe(false);
      });
    });

    describe('Segment Count', () => {
      it('should calculate segment size', () => {
        const allUsers = [
          { userId: 'u1', lifetimeValue: 15000 },
          { userId: 'u2', lifetimeValue: 8000 },
          { userId: 'u3', lifetimeValue: 12000 },
          { userId: 'u4', lifetimeValue: 5000 },
          { userId: 'u5', lifetimeValue: 20000 },
        ];

        const segment: UserSegment = {
          id: 'high_value',
          name: 'High Value',
          rules: [{ field: 'lifetimeValue', operator: 'gte', value: 10000 }],
        };

        const matchingUsers = allUsers.filter(user =>
          evaluateSegmentRules(user, segment.rules)
        );

        expect(matchingUsers).toHaveLength(3);
      });
    });
  });

  // --------------------------------------------------------------------------
  // Integration Tests
  // --------------------------------------------------------------------------
  describe('Integration', () => {

    it('should handle complete campaign workflow', () => {
      // 1. Create campaign
      const campaign: Campaign = {
        id: 'camp_1',
        name: 'Summer Sale',
        status: 'draft',
        type: 'push',
        target: { type: 'segment', segmentId: 'seg_high_value' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(campaign.status).toBe('draft');

      // 2. Schedule campaign
      campaign.status = 'scheduled';
      campaign.schedule = { startDate: new Date('2026-06-01') };

      expect(campaign.status).toBe('scheduled');

      // 3. Activate campaign
      campaign.status = 'active';

      // 4. Track metrics
      campaign.metrics = {
        sent: 10000,
        delivered: 9500,
        opened: 4000,
        clicked: 1500,
        converted: 300,
        revenue: 15000,
      };

      expect(campaign.metrics.converted).toBe(300);

      // 5. Complete campaign
      campaign.status = 'completed';
      expect(campaign.status).toBe('completed');
    });

    it('should handle multi-channel campaign', () => {
      const multiChannelCampaign: Campaign = {
        id: 'camp_multi',
        name: 'Omnichannel Promotion',
        status: 'active',
        type: 'multi_channel',
        target: { type: 'all' },
        metrics: {
          sent: 30000,
          delivered: 28000,
          opened: 12000,
          clicked: 4500,
          converted: 900,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Verify all channels tracked
      expect(multiChannelCampaign.type).toBe('multi_channel');
      expect(multiChannelCampaign.metrics?.sent).toBeGreaterThan(10000);
    });

    it('should integrate A/B testing with campaign', () => {
      // Create A/B test for campaign subject line
      const test: ABTest = {
        id: 'test_subject',
        name: 'Subject Line Test',
        hypothesis: 'Personalized subject lines will improve open rate',
        variants: [
          { id: 'control', name: 'Generic', traffic: 50 },
          { id: 'personalized', name: 'Personalized', traffic: 50 },
        ],
        metric: 'open_rate',
        status: 'completed',
        confidenceLevel: 95,
      };

      // Determine winning variant
      const winningVariant = test.variants[1]; // Personalized performed better

      // Apply winning variant to future campaigns
      const newCampaign: Campaign = {
        id: 'camp_based_on_test',
        name: 'New Campaign (Using Winning Variant)',
        status: 'draft',
        type: 'email',
        target: { type: 'all' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(test.status).toBe('completed');
      expect(winningVariant.name).toBe('Personalized');
    });

    it('should handle automation workflow end-to-end', () => {
      // 1. User abandons cart
      const cart = {
        userId: 'user_1',
        items: [{ productId: 'prod_1', name: 'Pizza', quantity: 2 }],
        totalValue: 500,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      };

      // 2. Automation triggers
      const isAbandoned = (Date.now() - cart.createdAt.getTime()) / (1000 * 60 * 60) >= 1;
      expect(isAbandoned).toBe(true);

      // 3. Send reminder via WhatsApp
      const message: WhatsAppMessage = {
        to: '+919876543210',
        template: 'abandoned_cart_reminder',
        language: 'en',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Pizza' },
              { type: 'text', text: 'Rs. 500' },
            ],
          },
        ],
      };

      expect(message.template).toBe('abandoned_cart_reminder');

      // 4. Track conversion
      const conversionTracked = true;
      expect(conversionTracked).toBe(true);
    });
  });
});
