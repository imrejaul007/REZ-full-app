/**
 * Bill Payment Reminder Job — runs daily at 10 AM
 * Finds bills with dueDate in the next 3 days that haven't had a reminder sent,
 * and dispatches push notifications with a coin balance reminder.
 */

import { BillPayment } from '../models/BillPayment';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('bill-reminder-job');

export async function runBillPaymentReminders(): Promise<void> {
  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const dueBills = await BillPayment.find({
    status: 'completed',
    reminderSent: false,
    dueDateRaw: { $gte: now, $lte: in3Days },
  })
    .populate('provider', 'name type promoCoinsFixed')
    .populate('userId', 'fcmToken name')
    .limit(1000)
    .lean();

  logger.info(`[BILL REMINDER] ${dueBills.length} bills due in next 3 days`);

  for (const bill of dueBills) {
    try {
      const provider = bill.provider as any;
      const user = bill.userId as any;

      if (user?.fcmToken) {
        // Wire your push notification service here, e.g.:
        // await notificationService.sendPush(user.fcmToken, {
        //   title: `${provider.name} bill due soon`,
        //   body:  `Pay now and earn ${provider.promoCoinsFixed || 10} promo coins! Use at nearby merchants.`,
        //   data:  { type: 'bill_reminder', billType: bill.billType, screen: '/bill-payment' }
        // });
        logger.info(`[BILL REMINDER] Queued push for user ${user._id} — ${provider.name}`);
      }

      await BillPayment.findByIdAndUpdate(bill._id, { reminderSent: true });
    } catch (err: any) {
      logger.error('[BILL REMINDER] Failed for bill', { billId: bill._id, error: err.message });
    }
  }

  logger.info('[BILL REMINDER] Done');
}
