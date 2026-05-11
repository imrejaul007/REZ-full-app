/**
 * Analytics Tracking Service
 *
 * Provides centralized event tracking for user acquisition, engagement, and conversion.
 * Events are sent to the analytics backend and can be enriched with UTM data.
 */
export declare const AnalyticsEvents: {
    readonly USER_SIGNUP: "user_signup";
    readonly USER_LOGIN: "user_login";
    readonly ORDER_CREATED: "order_created";
    readonly ORDER_COMPLETED: "order_completed";
    readonly PAYMENT_SUCCESS: "payment_success";
    readonly PAYMENT_FAILED: "payment_failed";
    readonly COINS_EARNED: "coins_earned";
    readonly COINS_REDEEMED: "coins_redeemed";
    readonly COINS_EXPIRED: "coins_expired";
    readonly CAMPAIGN_CLICK: "campaign_click";
    readonly REFERRAL_SENT: "referral_sent";
    readonly REFERRAL_COMPLETED: "referral_completed";
};
export type AnalyticsEventType = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];
export interface AnalyticsEventProperties {
    userId?: string;
    orderId?: string;
    orderNumber?: string;
    amount?: number;
    currency?: string;
    paymentMethod?: string;
    coinsAmount?: number;
    campaignId?: string;
    referralCode?: string;
    referredBy?: string;
    source?: string;
    medium?: string;
    campaign?: string;
    deviceRisk?: string;
    isNewUser?: boolean;
    method?: string;
    status?: string;
    errorMessage?: string;
    [key: string]: string | number | boolean | undefined;
}
export interface AnalyticsContext {
    ipAddress?: string;
    userAgent?: string;
    referer?: string;
    sessionId?: string;
    deviceId?: string;
}
/**
 * Track an analytics event
 * In production, this sends to the analytics backend (e.g., Segment, Mixpanel, custom API)
 * For now, logs to console in development
 */
export declare function track(event: AnalyticsEventType | string, properties?: AnalyticsEventProperties, context?: AnalyticsContext): void;
/**
 * Track user signup event
 */
export declare function trackUserSignup(userId: string, properties?: {
    method?: 'phone' | 'email' | 'social';
    referralCode?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
}): void;
/**
 * Track user login event
 */
export declare function trackUserLogin(userId: string, properties?: {
    method?: 'phone' | 'pin' | 'social';
    deviceRisk?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
}): void;
/**
 * Track order creation event
 */
export declare function trackOrderCreated(orderId: string, userId: string, properties?: {
    orderNumber?: string;
    amount?: number;
    currency?: string;
    itemCount?: number;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
}): void;
/**
 * Track order completion event
 */
export declare function trackOrderCompleted(orderId: string, userId: string, properties?: {
    orderNumber?: string;
    amount?: number;
    currency?: string;
    coinsEarned?: number;
}): void;
/**
 * Track payment success event
 */
export declare function trackPaymentSuccess(orderId: string, userId: string, properties?: {
    amount?: number;
    currency?: string;
    paymentMethod?: string;
    transactionId?: string;
}): void;
/**
 * Track payment failure event
 */
export declare function trackPaymentFailed(orderId: string, userId: string, properties?: {
    amount?: number;
    currency?: string;
    paymentMethod?: string;
    errorMessage?: string;
    failureReason?: string;
}): void;
/**
 * Track coins earned event
 */
export declare function trackCoinsEarned(userId: string, coinsAmount: number, properties?: {
    source?: 'order' | 'referral' | 'promotion' | 'daily_bonus';
    orderId?: string;
    campaignId?: string;
}): void;
/**
 * Track coins redeemed event
 */
export declare function trackCoinsRedeemed(userId: string, coinsAmount: number, properties?: {
    rewardId?: string;
    rewardName?: string;
    orderId?: string;
}): void;
/**
 * Track referral sent event
 */
export declare function trackReferralSent(userId: string, referredUserId: string, properties?: {
    referralCode?: string;
    channel?: 'sms' | 'whatsapp' | 'email' | 'link';
    utmSource?: string;
}): void;
/**
 * Track referral completed event (when referred user signs up)
 */
export declare function trackReferralCompleted(referrerUserId: string, referredUserId: string, properties?: {
    referralCode?: string;
    rewardCoins?: number;
}): void;
