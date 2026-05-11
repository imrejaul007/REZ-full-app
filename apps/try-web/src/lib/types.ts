// Trial Types
export interface TrialCard {
  id: string;
  title: string;
  category: string;
  categoryEmoji?: string;
  merchant: {
    id: string;
    name: string;
    image?: string;
  };
  image: string;
  images?: string[];
  description?: string;
  coinPrice: number;
  commitmentFee: number;
  originalPrice: number;
  distance: number;
  distanceUnit: string;
  slotsRemaining: number;
  slotsTotal: number;
  rating?: number;
  ratingCount?: number;
  expiresAt?: string;
  validDuration?: string;
  rewards?: {
    coinsEarned: number;
    brandedCoinsEarned: number;
  };
}

export interface BookingRequest {
  trialId: string;
  commitmentFeePaymentId: string;
  userGeo: {
    lat: number;
    lng: number;
  };
}

export interface BookingResponse {
  success: boolean;
  data: {
    bookingId: string;
    qrToken: string;
    qrExpiresAt: string;
    validUntil: string;
    trial: {
      id: string;
      title: string;
      merchant: string;
    };
  };
  message?: string;
}

export interface HistoryItem {
  bookingId: string;
  trialId: string;
  title: string;
  merchant: string;
  merchantImage?: string;
  image: string;
  coinsPaid: number;
  commitmentFeePaid: number;
  bookingDate: string;
  status: 'active' | 'completed' | 'expired';
  qrToken?: string;
  qrExpiresAt?: string;
  validUntil?: string;
  rating?: number;
  reviewText?: string;
  completedDate?: string;
  expiredDate?: string;
}

export interface CoinsData {
  totalBalance: number;
  buckets: {
    amount: number;
    expiresAt: string;
    source: 'subscription' | 'pack' | 'earned';
  }[];
  recentTransactions: Array<{
    id: string;
    type: 'earn' | 'spend' | 'expire';
    amount: number;
    description: string;
    date: string;
  }>;
}

export interface ScoreData {
  score: number;
  tier: 'curious' | 'explorer' | 'adventurer' | 'pioneer';
  nextTierPoints: number;
  nextTierName: string;
  stats: {
    categoriesTried: number;
    merchantsDiscovered: number;
    currentStreak: number;
    reviewsGiven: number;
  };
  recentEvents: Array<{
    id: string;
    description: string;
    points: number;
    date: string;
    emoji?: string;
  }>;
  leaderboardPercentile?: number;
  leaderboardCity?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category?: string;
  categoryEmoji?: string;
  target: number;
  completed: number;
  reward: {
    rezCoins: number;
    trialCoins: number;
  };
  endsAt: string;
  isCompleted: boolean;
  isExpired: boolean;
}

export interface CategoryBadge {
  category: string;
  categoryEmoji?: string;
  level: 'Newcomer' | 'Regular' | 'Expert' | 'Master';
  trialCount: number;
  nextLevelThreshold: number;
}

export interface BadgesData {
  earned: CategoryBadge[];
  undiscovered: Array<{ category: string; categoryEmoji?: string }>;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  trialCount: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  userRank: number;
  userScore: number;
}

export interface SurpriseData {
  category: string;
  categoryEmoji?: string;
  distance: string;
  expiresAt: string;
  merchant?: {
    id: string;
    name: string;
    image?: string;
  };
  trial?: {
    id: string;
    title: string;
    image?: string;
    coinPrice: number;
    originalPrice: number;
  };
  isBooked?: boolean;
}

export interface Bundle {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  trialCount: number;
  trialCoinsIncluded: number;
  rezCoinsBonus: number;
  validDays: number;
  category?: string;
  isFeatured?: boolean;
}

export interface ActiveBundle {
  id: string;
  name: string;
  slotsTotal: number;
  slotsUsed: number;
  expiresAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  description?: string;
  type: 'MISSION_SPRINT' | 'FESTIVAL' | 'CATEGORY_PUSH';
  goal: string;
  reward: string;
  endsAt: string;
  image?: string;
  isJoined: boolean;
  isCompleted: boolean;
  progress?: {
    completed: number;
    target: number;
  };
}
