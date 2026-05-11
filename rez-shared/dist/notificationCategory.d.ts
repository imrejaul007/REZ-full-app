export declare const NOTIFICATION_CATEGORIES: {
    readonly ORDER: "order";
    readonly PAYMENT: "payment";
    readonly LOYALTY: "loyalty";
    readonly PROMOTION: "promotion";
    readonly ACCOUNT: "account";
    readonly SECURITY: "security";
    readonly SUPPORT: "support";
    readonly SYSTEM: "system";
    readonly MARKETING: "marketing";
    readonly OFFER: "offer";
};
export type NotificationCategory = typeof NOTIFICATION_CATEGORIES[keyof typeof NOTIFICATION_CATEGORIES];
