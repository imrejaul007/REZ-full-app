/**
 * Tracks loan outcomes and reports to ReZ Mind
 * Runs daily to check for completed/overdue loans
 */
import { LoanApplication } from '../models/LoanApplication';
import { reportLoanOutcome } from '../services/intentFeedback';

const LoanApplicationModel = LoanApplication;

export async function trackLoanOutcomes(): Promise<void> {
  const now = new Date();

  // Find disbursed loans that need outcome tracking
  const disbursedLoans = await LoanApplicationModel.find({
    status: 'disbursed',
    outcomeTracked: { $ne: true },
  });

  for (const loan of disbursedLoans) {
    if (!loan.disbursedAt) continue;

    const daysSinceDisbursement = Math.floor(
      (now.getTime() - loan.disbursedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine outcome based on days since disbursement
    let outcome: 'repaid_ontime' | 'repaid_late' | 'partially_defaulted' | 'fully_defaulted';

    if (loan.repaidAt && loan.disbursedAt) {
      const repaymentDays = Math.floor(
        (loan.repaidAt.getTime() - loan.disbursedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const expectedDays = (loan.tenure ?? 1) * 30; // Approximate
      outcome = repaymentDays <= expectedDays ? 'repaid_ontime' : 'repaid_late';
    } else if (daysSinceDisbursement > 90) {
      outcome = (loan.overdueDays ?? 0) > 30 ? 'fully_defaulted' : 'partially_defaulted';
    } else {
      // Loan still active, skip
      continue;
    }

    // Report outcome
    await reportLoanOutcome({
      userId: loan.userId ?? '',
      loanId: loan.id?.toString() ?? '',
      applicationId: loan.partnerApplicationId ?? '',
      amount: loan.amount ?? 0,
      partnerId: loan.partnerId ?? '',
      disbursedAt: loan.disbursedAt,
      outcome,
      repaidAt: loan.repaidAt ?? undefined,
      overdueDays: loan.overdueDays ?? undefined,
    });

    // Mark as tracked
    loan.outcomeTracked = true;
    await loan.save();
  }
}
