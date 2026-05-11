// Analytics utility for tracking user events

type EventName =
  | 'page_view'
  | 'trial_view'
  | 'trial_book'
  | 'trial_complete'
  | 'coins_purchase'
  | 'signup'
  | 'login'
  | 'mission_complete'
  | 'badge_earned';

interface EventParams {
  [key: string]: string | number | boolean;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function trackEvent(eventName: EventName, params?: EventParams): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

export function trackPageView(url: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX', {
      page_path: url,
    });
  }
}

// Preset event tracking functions
export const analytics = {
  pageView: (path: string) => {
    trackEvent('page_view', { path });
    trackPageView(path);
  },

  trialView: (trialId: string, category: string) => {
    trackEvent('trial_view', { trial_id: trialId, category });
  },

  trialBook: (trialId: string, category: string, price: number) => {
    trackEvent('trial_book', {
      trial_id: trialId,
      category,
      value: price,
    });
  },

  trialComplete: (trialId: string, coinsEarned: number) => {
    trackEvent('trial_complete', {
      trial_id: trialId,
      coins_earned: coinsEarned,
    });
  },

  coinsPurchase: (amount: number, packIndex: number) => {
    trackEvent('coins_purchase', {
      amount,
      pack_index: packIndex,
      currency: 'INR',
    });
  },

  signup: (method: 'phone' | 'email') => {
    trackEvent('signup', { method });
  },

  login: (method: 'phone' | 'otp') => {
    trackEvent('login', { method });
  },

  missionComplete: (missionId: string, coinsEarned: number) => {
    trackEvent('mission_complete', {
      mission_id: missionId,
      coins_earned: coinsEarned,
    });
  },

  badgeEarned: (category: string, level: string) => {
    trackEvent('badge_earned', { category, level });
  },
};
