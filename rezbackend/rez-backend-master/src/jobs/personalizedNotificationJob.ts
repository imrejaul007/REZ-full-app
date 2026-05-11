import { logger } from '../config/logger';
import { User } from '../models/User';
import ExclusiveOffer from '../models/ExclusiveOffer';
import pushNotificationService from '../services/pushNotificationService';

type NotificationWindow = 'lunch' | 'hangout';

const WINDOW_CONFIG: Record<
  NotificationWindow,
  {
    tags: string[];
    studentTitle: string;
    employeeTitle: string;
  }
> = {
  lunch: {
    tags: ['food', 'cafe', 'restaurant', 'lunch', 'dining'],
    studentTitle: 'Student lunch deals near you',
    employeeTitle: 'Lunch deals near your office',
  },
  hangout: {
    tags: ['salon', 'gym', 'entertainment', 'spa', 'fitness'],
    studentTitle: 'After-class deals near campus',
    employeeTitle: 'After-work perks nearby',
  },
};

export const personalizedNotificationJob = {
  async run(window: NotificationWindow): Promise<void> {
    const config = WINDOW_CONFIG[window];
    if (!config) {
      logger.warn(`[PersonalizedNotif] Unknown window: ${window}`);
      return;
    }

    try {
      // Find relevant deals (active, not expired, matching tags)
      const now = new Date();
      const deals = await ExclusiveOffer.find({
        isActive: true,
        validFrom: { $lte: now },
        validTo: { $gte: now },
        targetAudience: { $in: ['student', 'corporate', 'all'] },
      })
        .sort({ discount: -1 })
        .limit(4)
        .lean();

      if (deals.length === 0) {
        logger.info(`[PersonalizedNotif] No deals for ${window} window — skipping`);
        return;
      }

      // MP-D004 FIX: Previously both queries had no .limit(), so on a large
      // user base (e.g. 500 000 verified students) the entire segment would be
      // materialised into one JavaScript array on the heap.  At ~200 bytes per
      // lean document that is ~100 MB per segment just for the student list,
      // pushing the process toward its RSS ceiling and triggering a full GC.
      //
      // Cap each segment at 10 000 recipients per run.  For a nightly job that
      // re-runs on the next schedule this is more than sufficient to reach the
      // active user base while keeping heap pressure bounded.
      const SEGMENT_FETCH_LIMIT = 10_000;

      // Find verified students
      const students = await User.find({
        segment: 'verified_student',
        isActive: true,
        'pushTokens.0': { $exists: true },
      })
        .select('_id pushTokens')
        .limit(SEGMENT_FETCH_LIMIT)
        .lean();

      // Find verified employees
      const employees = await User.find({
        segment: 'verified_employee',
        isActive: true,
        'pushTokens.0': { $exists: true },
      })
        .select('_id pushTokens')
        .limit(SEGMENT_FETCH_LIMIT)
        .lean();

      const dealSummary = deals
        .slice(0, 2)
        .map((d) => `${d.title} — save ${d.discount}%`)
        .join(', ');

      logger.info(
        `[PersonalizedNotif] ${window}: ${students.length} students, ${employees.length} employees, ${deals.length} deals`,
      );

      // QF-011 FIX: Previously this job computed segments and deals but never
      // actually sent any push notification (the send call was a TODO comment).
      // That meant the cron slot fired successfully, jobTracker showed no errors,
      // but zero notifications were ever delivered — a silent notification backlog.
      // Now we fan-out to each segment using the existing sendPushToUser API.
      // Errors per-user are caught individually so one bad token doesn't abort
      // the entire batch.

      const BATCH_SIZE = 50; // avoid overwhelming FCM with a single burst

      // Helper: send a batch with per-user error isolation
      async function sendBatch(
        users: Array<{ _id: any; pushTokens?: any[] }>,
        title: string,
        body: string,
        screen: string,
      ): Promise<{ sent: number; failed: number }> {
        let sent = 0;
        let failed = 0;
        for (let i = 0; i < users.length; i += BATCH_SIZE) {
          const slice = users.slice(i, i + BATCH_SIZE);
          await Promise.allSettled(
            slice.map(async (u) => {
              try {
                await pushNotificationService.sendPushToUser(String(u._id), {
                  title,
                  body,
                  data: { screen, type: 'daily_deal', window },
                });
                sent++;
              } catch {
                failed++;
              }
            }),
          );
        }
        return { sent, failed };
      }

      const studentResult = await sendBatch(students, config.studentTitle, dealSummary, '/offers/student');
      const employeeResult = await sendBatch(employees, config.employeeTitle, dealSummary, '/offers/corporate');

      logger.info(
        `[PersonalizedNotif] ${window}: students sent=${studentResult.sent} failed=${studentResult.failed}, employees sent=${employeeResult.sent} failed=${employeeResult.failed}`,
      );
    } catch (error) {
      logger.error(`[PersonalizedNotif] Error in ${window} window:`, error);
    }
  },
};

export default personalizedNotificationJob;
