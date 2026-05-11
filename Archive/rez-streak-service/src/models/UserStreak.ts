import mongoose, { Schema, Document } from 'mongoose';

export interface IUserStreak extends Document {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastVisitDate: Date | null;
  totalVisits: number;
  achievedMilestones: Array<{
    streak: number;
    achievedAt: Date;
  }>;
  streakHistory: Array<{
    date: Date;
    action: 'visit' | 'milestone' | 'recovery' | 'lapse';
    streak: number;
    coinsEarned?: number;
  }>;
  consecutiveDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserStreakSchema = new Schema<IUserStreak>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
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
    lastVisitDate: {
      type: Date,
      default: null,
    },
    totalVisits: {
      type: Number,
      default: 0,
      min: 0,
    },
    achievedMilestones: {
      type: [
        {
          streak: { type: Number, required: true },
          achievedAt: { type: Date, required: true },
        },
      ],
      default: [],
    },
    streakHistory: {
      type: [
        {
          date: { type: Date, required: true },
          action: {
            type: String,
            enum: ['visit', 'milestone', 'recovery', 'lapse'],
            required: true,
          },
          streak: { type: Number, required: true },
          coinsEarned: { type: Number },
        },
      ],
      default: [],
    },
    consecutiveDays: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
UserStreakSchema.index({ userId: 1, lastVisitDate: -1 });
UserStreakSchema.index({ 'streakHistory.date': -1 });

// Virtual for checking if streak is active today
UserStreakSchema.virtual('isStreakActiveToday').get(function () {
  if (!this.lastVisitDate) return false;
  const today = new Date();
  const lastVisit = new Date(this.lastVisitDate);
  return (
    today.getFullYear() === lastVisit.getFullYear() &&
    today.getMonth() === lastVisit.getMonth() &&
    today.getDate() === lastVisit.getDate()
  );
});

// Method to check if streak can be recovered
UserStreakSchema.methods.canRecoverStreak = function (): boolean {
  if (!this.lastVisitDate) return false;
  const today = new Date();
  const lastVisit = new Date(this.lastVisitDate);
  const diffTime = Math.abs(today.getTime() - lastVisit.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  // Can recover if missed 1 day (diffDays === 2 means missed yesterday)
  return diffDays === 2;
};

// Static method to find or create user streak
UserStreakSchema.statics.findOrCreate = async function (userId: string) {
  let userStreak = await this.findOne({ userId });
  if (!userStreak) {
    userStreak = await this.create({ userId });
  }
  return userStreak;
};

export const UserStreak = mongoose.model<IUserStreak>('UserStreak', UserStreakSchema);
