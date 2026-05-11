/**
 * ReZ Score Engine — Proprietary behavioral credit scoring (0–850)
 *
 * Inputs: spend behavior, order history, wallet balance, coins, payment history
 * Output: score, eligibility bands, credit improvement tips
 */

export interface ScoreInputs {
  totalSpend30d: number;
  orderCount30d: number;
  avgOrderValue: number;
  visitFrequency: number;    // visits per week
  paymentHistory: number;    // 0–1: fraction of on-time payments
  walletBalance: number;
  coinsBalance: number;
  accountAgeDays: number;    // days since first REZ transaction
}

export interface ScoreResult {
  rezScore: number;
  eligibility: {
    maxLoanAmount: number;
    maxCreditCardLimit: number;
    bnplEnabled: boolean;
    bnplLimit: number;
  };
  tips: string[];
}

// Weight table (sums to 1.0)
const WEIGHTS = {
  paymentHistory: 0.35,
  totalSpend30d: 0.20,
  orderCount30d: 0.15,
  visitFrequency: 0.10,
  walletBalance: 0.10,
  accountAge: 0.10,
};

// Score bands → eligibility
const BANDS = [
  { min: 750, loanMultiplier: 50, cardMultiplier: 40, bnplLimit: 15000 },
  { min: 650, loanMultiplier: 30, cardMultiplier: 20, bnplLimit: 10000 },
  { min: 550, loanMultiplier: 15, cardMultiplier: 10, bnplLimit: 5000 },
  { min: 450, loanMultiplier: 8,  cardMultiplier: 5,  bnplLimit: 2000 },
  { min: 0,   loanMultiplier: 0,  cardMultiplier: 0,  bnplLimit: 0 },
];

export function calculateRezScore(inputs: ScoreInputs): ScoreResult {
  // Normalize each factor to 0–1
  const norm = {
    paymentHistory: clamp(inputs.paymentHistory, 0, 1),
    totalSpend30d: normalize(inputs.totalSpend30d, 0, 50000),
    orderCount30d: normalize(inputs.orderCount30d, 0, 30),
    visitFrequency: normalize(inputs.visitFrequency, 0, 14),
    walletBalance: normalize(inputs.walletBalance, 0, 10000),
    accountAge: normalize(inputs.accountAgeDays, 0, 365),
  };

  const rawScore =
    norm.paymentHistory * WEIGHTS.paymentHistory +
    norm.totalSpend30d * WEIGHTS.totalSpend30d +
    norm.orderCount30d * WEIGHTS.orderCount30d +
    norm.visitFrequency * WEIGHTS.visitFrequency +
    norm.walletBalance * WEIGHTS.walletBalance +
    norm.accountAge * WEIGHTS.accountAge;

  // Scale to 300–850 (like CIBIL range)
  const rezScore = Math.round(300 + rawScore * 550);

  const band = BANDS.find((b) => rezScore >= b.min) ?? BANDS[BANDS.length - 1];

  const avgMonthlySpend = inputs.totalSpend30d;
  const maxLoanAmount = Math.round(avgMonthlySpend * band.loanMultiplier);
  const maxCreditCardLimit = Math.round(avgMonthlySpend * band.cardMultiplier);
  const bnplEnabled = band.bnplLimit > 0;

  const tips = generateTips(inputs, rezScore);

  return {
    rezScore,
    eligibility: {
      maxLoanAmount,
      maxCreditCardLimit,
      bnplEnabled,
      bnplLimit: band.bnplLimit,
    },
    tips,
  };
}

function generateTips(inputs: ScoreInputs, score: number): string[] {
  const tips: string[] = [];
  if (inputs.paymentHistory < 0.9)
    tips.push('Pay your EMIs and bills on time to significantly boost your score.');
  if (inputs.orderCount30d < 5)
    tips.push('Order more frequently on ReZ — activity improves your ReZ Score.');
  if (inputs.walletBalance < 500)
    tips.push('Keep a wallet balance of ₹500+ to strengthen your credit profile.');
  if (inputs.visitFrequency < 3)
    tips.push('Open the ReZ app more often — engagement improves your behavioral score.');
  if (inputs.totalSpend30d < 2000)
    tips.push('Increase your monthly spend on ReZ to unlock higher loan limits.');
  if (score < 550)
    tips.push('Your score is below average. Focus on consistent activity for 90 days to see improvement.');
  if (tips.length === 0)
    tips.push('Great profile! You are eligible for our best offers.');
  return tips;
}

function normalize(value: number, min: number, max: number): number {
  return clamp((value - min) / (max - min), 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
