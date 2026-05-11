import { Request, Response } from 'express';
import SocialProofStat from '../models/SocialProofStat';
import { Category } from '../models/Category';
import { sendSuccess, sendNotFound } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';

// Get social proof stats for a category
export const getSocialProofStats = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query;

  try {
    let stats;

    if (category) {
      const categoryDoc = await Category.findOne({ slug: category as string }).lean();

      if (!categoryDoc) {
        return sendNotFound(res, 'Category not found');
      }

      stats = await SocialProofStat.findOne({ category: categoryDoc._id }).lean();

      if (!stats) {
        // Return default stats if not found
        stats = {
          category: categoryDoc._id,
          shoppedToday: 0,
          totalEarned: 0,
          topHashtags: [],
          recentBuyers: [],
          updatedAt: new Date(),
        };
      }
    } else {
      // Push all aggregation work to MongoDB to avoid loading up to 1000 full
      // documents into Node memory and iterating them in JS.
      const [numericAgg, hashtagAgg, buyerAgg] = await Promise.all([
        // Sum shoppedToday and totalEarned across all category documents.
        SocialProofStat.aggregate([
          {
            $group: {
              _id: null,
              shoppedToday: { $sum: '$shoppedToday' },
              totalEarned: { $sum: '$totalEarned' },
            },
          },
        ]),
        // Unwind topHashtags, count occurrences, return top 5 descending.
        SocialProofStat.aggregate([
          { $unwind: { path: '$topHashtags', preserveNullAndEmptyArrays: false } },
          { $group: { _id: '$topHashtags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          { $project: { _id: 0, tag: '$_id' } },
        ]),
        // Unwind recentBuyers, sort by numeric prefix of timeAgo ascending, take top 5.
        SocialProofStat.aggregate([
          { $unwind: { path: '$recentBuyers', preserveNullAndEmptyArrays: false } },
          {
            $addFields: {
              'recentBuyers._timeAgoNum': {
                $toInt: {
                  $arrayElemAt: [{ $split: ['$recentBuyers.timeAgo', ' '] }, 0],
                },
              },
            },
          },
          { $sort: { 'recentBuyers._timeAgoNum': 1 } },
          { $limit: 5 },
          { $replaceRoot: { newRoot: '$recentBuyers' } },
          { $project: { _timeAgoNum: 0 } },
        ]),
      ]);

      stats = {
        shoppedToday: numericAgg[0]?.shoppedToday ?? 0,
        totalEarned: numericAgg[0]?.totalEarned ?? 0,
        topHashtags: hashtagAgg.map((h: { tag: string }) => h.tag),
        recentBuyers: buyerAgg,
        updatedAt: new Date(),
      };
    }

    sendSuccess(res, { stats }, 'Social proof stats retrieved successfully');
  } catch (_error) {
    throw new AppError('Failed to fetch social proof stats', 500);
  }
});
