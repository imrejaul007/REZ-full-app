import mongoose, { Schema, Document } from 'mongoose';

export interface IStreakHistory extends Document {
  userId: string;
  entries: Array<{
    date: Date;
    action: 'visit' | 'milestone' | 'recovery' | 'lapse';
    streak: number;
    coinsEarned?: number;
    metadata?: Record<string, unknown>;
  }>;
  totalCoinsEarned: number;
  totalMilestones: number;
  createdAt: Date;
  updatedAt: Date;
}

const StreakHistorySchema = new Schema<IStreakHistory>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    entries: {
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
          metadata: { type: Schema.Types.Mixed },
        },
      ],
      default: [],
    },
    totalCoinsEarned: {
      type: Number,
      default: 0,
    },
    totalMilestones: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient history queries
StreakHistorySchema.index({ userId: 1, 'entries.date': -1 });

// Method to add entry
StreakHistorySchema.methods.addEntry = async function (entry: {
  date: Date;
  action: 'visit' | 'milestone' | 'recovery' | 'lapse';
  streak: number;
  coinsEarned?: number;
  metadata?: Record<string, unknown>;
}) {
  this.entries.push(entry);
  if (entry.coinsEarned) {
    this.totalCoinsEarned += entry.coinsEarned;
  }
  if (entry.action === 'milestone') {
    this.totalMilestones += 1;
  }
  await this.save();
};

// Static method to find or create history
StreakHistorySchema.statics.findOrCreate = async function (userId: string) {
  let history = await this.findOne({ userId });
  if (!history) {
    history = await this.create({ userId });
  }
  return history;
};

// Static method to get recent entries
StreakHistorySchema.statics.getRecentEntries = async function (
  userId: string,
  days: number = 30
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const history = await this.findOne({ userId });
  if (!history) return [];

  return history.entries.filter(
    (entry) => new Date(entry.date) >= cutoffDate
  );
};

export const StreakHistory = mongoose.model<IStreakHistory>('StreakHistory', StreakHistorySchema);
