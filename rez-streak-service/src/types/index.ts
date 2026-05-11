export interface MilestoneReward {
  streak: number;
  coins: number;
  label: string;
}

export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastVisitDate: Date | null;
  totalVisits: number;
  milestones: MilestoneInfo[];
  streakHistory: StreakHistoryEntry[];
}

export interface MilestoneInfo {
  streak: number;
  coins: number;
  label: string;
  achieved: boolean;
  achievedAt?: Date;
}

export interface StreakHistoryEntry {
  date: Date;
  action: 'visit' | 'milestone' | 'recovery' | 'lapse';
  streak: number;
  coinsEarned?: number;
}

export interface VisitResult {
  success: boolean;
  streak: number;
  isNewDay: boolean;
  milestone?: MilestoneReward;
  message: string;
}

export interface RecoveryResult {
  success: boolean;
  streak: number;
  coinsDeducted: number;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
