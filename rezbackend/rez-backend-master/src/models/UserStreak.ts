import mongoose, { Schema, Document } from 'mongoose';

export interface IUserStreak extends Document {
  user: mongoose.Types.ObjectId;
  type: 'login' | 'order' | 'review' | 'app_open' | 'savings';
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  streakStartDate: Date;
  totalDays: number;
  milestones: Array<{
    day: number;
    coinsReward: number;
    badgeReward?: string;
    rewardsClaimed: boolean;
    claimedAt?: Date;
  }>;
  frozen: boolean; // Streak freeze active
  freezeExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  updateStreak(): Promise<IUserStreak>;
  freezeStreak(days?: number): Promise<IUserStreak>;
  claimMilestone(day: number): Promise<IUserStreak>;
}

const UserStreakSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['login', 'order', 'review', 'app_open', 'savings'],
      required: true,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    streakStartDate: {
      type: Date,
      default: Date.now,
    },
    totalDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    milestones: [
      {
        day: {
          type: Number,
          required: true,
        },
        coinsReward: {
          type: Number,
          default: 0,
          min: 0,
        },
        badgeReward: {
          type: String,
          trim: true,
        },
        rewardsClaimed: {
          type: Boolean,
          default: false,
        },
        claimedAt: Date,
      },
    ],
    frozen: {
      type: Boolean,
      default: false,
    },
    freezeExpiresAt: Date,
  },
  {
    timestamps: true,
  },
);

// Compound index
UserStreakSchema.index({ user: 1, type: 1 }, { unique: true });
UserStreakSchema.index({ user: 1, currentStreak: -1 });
UserStreakSchema.index({ lastActivityDate: -1 });
UserStreakSchema.index({ frozen: 1, freezeExpiresAt: 1 });

// IST timezone helpers — normalize to IST day boundaries (UTC+5:30).
// Streak "days" are IST calendar days, not UTC calendar days, because
// the vast majority of REZ users are in India.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getISTDayStart(date: Date): Date {
  const istTime = new Date(date.getTime() + IST_OFFSET_MS);
  istTime.setUTCHours(0, 0, 0, 0);
  return new Date(istTime.getTime() - IST_OFFSET_MS);
}

// Method to update streak
UserStreakSchema.methods.updateStreak = async function () {
  const now = new Date();
  const lastActivity = new Date(this.lastActivityDate);

  // Normalize both timestamps to the start of their respective IST calendar day
  // before computing the difference.  Using UTC midnight here was wrong for IST
  // users: activity at 23:30 IST (18:00 UTC) and activity at 00:30 IST next day
  // (19:00 UTC) both fall on the same UTC date, causing the streak to not advance.
  const nowISTStart = getISTDayStart(now);
  const lastISTStart = getISTDayStart(lastActivity);

  const daysDiff = Math.round((nowISTStart.getTime() - lastISTStart.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    // Same IST day, no update needed
    return this;
  } else if (daysDiff === 1) {
    // Consecutive IST day
    this.currentStreak += 1;
    this.totalDays += 1;

    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
  } else if (daysDiff > 1) {
    // Streak broken (missed at least one IST day)
    if (!this.frozen || nowISTStart > this.freezeExpiresAt!) {
      this.currentStreak = 1;
      this.streakStartDate = nowISTStart;
      this.frozen = false;
      this.freezeExpiresAt = undefined;
    } else {
      // Freeze saved the streak
      this.currentStreak += 1;
      this.frozen = false;
      this.freezeExpiresAt = undefined;
    }
    this.totalDays += 1;
  }

  this.lastActivityDate = new Date();

  return this.save();
};

// Method to freeze streak
UserStreakSchema.methods.freezeStreak = async function (days: number = 1) {
  this.frozen = true;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  this.freezeExpiresAt = expiresAt;

  return this.save();
};

// Method to claim milestone reward
UserStreakSchema.methods.claimMilestone = async function (day: number) {
  const milestone = this.milestones.find(
    (m: { day: number; rewardsClaimed: boolean; claimedAt?: Date }) => m.day === day,
  );

  if (!milestone) {
    throw new Error('Milestone not found');
  }

  if (milestone.rewardsClaimed) {
    throw new Error('Milestone reward already claimed');
  }

  if (this.currentStreak < day) {
    throw new Error('Milestone not reached yet');
  }

  milestone.rewardsClaimed = true;
  milestone.claimedAt = new Date();

  return this.save();
};

export default mongoose.model<IUserStreak>('UserStreak', UserStreakSchema);
