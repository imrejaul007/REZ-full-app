/**
 * ML Bias Detection Framework
 * Detects and measures various forms of bias in ML models
 */

import { predict, type TestDataPoint } from './model-testing';

export interface BiasMetric {
  name: string;
  description: string;
  value: number;
  threshold: number;
  isCompliant: boolean;
  subgroup?: string;
}

export interface BiasReport {
  model: string;
  timestamp: string;
  overallScore: number;
  metrics: BiasMetric[];
  flaggedGroups: string[];
  recommendations: string[];
  demographicParity?: DemographicParityMetrics;
  equalizedOdds?: EqualizedOddsMetrics;
  calibrationMetrics?: CalibrationMetrics;
}

interface DemographicParityMetrics {
  difference: number;
  ratio: number;
  maxDifference: number;
}

interface EqualizedOddsMetrics {
  truePositiveRateGap: Map<string, number>;
  falsePositiveRateGap: Map<string, number>;
  overallTPRGap: number;
  overallFPRGap: number;
}

interface CalibrationMetrics {
  byGroup: Map<string, { expected: number; actual: number; calibrationError: number }[]>;
  overallECE: number;
}

interface SubgroupStats {
  subgroup: string;
  size: number;
  positiveRate: number;
  truePositiveRate: number;
  falsePositiveRate: number;
  precision: number;
  accuracy: number;
  predictedPositiveRate: number;
}

interface SensitiveAttribute {
  name: string;
  values: string[];
}

// Configurable thresholds for bias detection
const BIAS_THRESHOLDS = {
  demographicParity: 0.1, // Maximum allowed difference in positive rates
  equalizedOdds: 0.05, // Maximum allowed TPR/FPR gap
  calibration: 0.05, // Maximum allowed calibration error
  disparateImpact: 0.8, // 4/5ths rule minimum ratio
  statisticalParity: 0.1,
};

const SENSITIVE_ATTRIBUTES: SensitiveAttribute[] = [
  { name: 'gender', values: ['male', 'female', 'non-binary', 'unknown'] },
  { name: 'age_group', values: ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'] },
  { name: 'race', values: ['asian', 'black', 'hispanic', 'white', 'other'] },
  { name: 'location', values: ['urban', 'suburban', 'rural'] },
  { name: 'income_level', values: ['low', 'medium', 'high'] },
];

/**
 * Detect bias across all configured sensitive attributes
 */
export async function detectBias(
  modelName: string,
  testData: TestDataPoint[],
  sensitiveAttr?: string
): Promise<BiasReport> {
  const report: BiasReport = {
    model: modelName,
    timestamp: new Date().toISOString(),
    overallScore: 1.0,
    metrics: [],
    flaggedGroups: [],
    recommendations: [],
  };

  // Determine which attributes to analyze
  const attributesToAnalyze = sensitiveAttr
    ? SENSITIVE_ATTRIBUTES.filter((a) => a.name === sensitiveAttr)
    : SENSITIVE_ATTRIBUTES;

  // Run predictions on test data
  const predictions = await Promise.all(
    testData.map((d) => predict(modelName, d.input))
  );

  // Analyze each sensitive attribute
  for (const attr of attributesToAnalyze) {
    const subgroupStats = calculateSubgroupStats(testData, predictions, attr);
    const biasMetrics = analyzeSubgroupBias(subgroupStats);

    report.metrics.push(...biasMetrics.metrics);

    if (biasMetrics.flagged) {
      report.flaggedGroups.push(attr.name);
      report.recommendations.push(...biasMetrics.recommendations);
    }

    // Store detailed metrics
    if (attr.name === 'gender') {
      report.demographicParity = calculateDemographicParity(subgroupStats);
    }

    // Calculate equalized odds
    const equalizedOdds = calculateEqualizedOdds(subgroupStats);
    if (report.equalizedOdds === undefined) {
      report.equalizedOdds = equalizedOdds;
    }
  }

  // Calculate calibration metrics
  report.calibrationMetrics = calculateCalibrationMetrics(testData, predictions);

  // Calculate overall score
  report.overallScore = calculateOverallBiasScore(report.metrics);

  // Generate recommendations if needed
  if (report.flaggedGroups.length > 0) {
    report.recommendations.push(...generateRecommendations(report.flaggedGroups));
  }

  return report;
}

/**
 * Calculate statistics for each subgroup
 */
function calculateSubgroupStats(
  testData: TestDataPoint[],
  predictions: Array<{ output: unknown; confidence?: number }>,
  attribute: SensitiveAttribute
): Map<string, SubgroupStats> {
  const stats = new Map<string, SubgroupStats>();

  // Group data by attribute value
  const groups = new Map<string, { data: TestDataPoint; prediction: unknown }[]>();

  testData.forEach((data, i) => {
    const attrValue = getSensitiveAttributeValue(data, attribute.name);
    if (!groups.has(attrValue)) {
      groups.set(attrValue, []);
    }
    groups.get(attrValue)!.push({ data, prediction: predictions[i].output });
  });

  // Calculate stats for each group
  groups.forEach((samples, subgroupName) => {
    const n = samples.length;
    if (n === 0) return;

    let truePositives = 0,
      falsePositives = 0,
      falseNegatives = 0,
      trueNegatives = 0;
    let correctPredictions = 0;
    let predictedPositive = 0;
    let actualPositive = 0;

    samples.forEach(({ data, prediction }) => {
      const isPositive = String(data.expected) === 'positive';
      const isPredictedPositive = String(prediction) === 'positive';

      if (isPositive && isPredictedPositive) truePositives++;
      if (!isPositive && isPredictedPositive) falsePositives++;
      if (isPositive && !isPredictedPositive) falseNegatives++;
      if (!isPositive && !isPredictedPositive) trueNegatives++;

      if (String(data.expected) === String(prediction)) {
        correctPredictions++;
      }

      if (isPredictedPositive) predictedPositive++;
      if (isPositive) actualPositive++;
    });

    stats.set(subgroupName, {
      subgroup: subgroupName,
      size: n,
      positiveRate: actualPositive / n,
      truePositiveRate: truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0,
      falsePositiveRate: falsePositives + trueNegatives > 0 ? falsePositives / (falsePositives + trueNegatives) : 0,
      precision: truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0,
      accuracy: correctPredictions / n,
      predictedPositiveRate: predictedPositive / n,
    });
  });

  return stats;
}

/**
 * Analyze bias within subgroups
 */
function analyzeSubgroupBias(
  subgroupStats: Map<string, SubgroupStats>
): { metrics: BiasMetric[]; flagged: boolean; recommendations: string[] } {
  const metrics: BiasMetric[] = [];
  let flagged = false;
  const recommendations: string[] = [];

  const groups = Array.from(subgroupStats.values());

  if (groups.length < 2) {
    return { metrics, flagged, recommendations };
  }

  // Calculate demographic parity
  const positiveRates = groups.map((g) => g.positiveRate);
  const maxDiff = Math.max(...positiveRates) - Math.min(...positiveRates);

  metrics.push({
    name: 'demographic_parity',
    description: 'Difference in positive prediction rates across groups',
    value: maxDiff,
    threshold: BIAS_THRESHOLDS.demographicParity,
    isCompliant: maxDiff <= BIAS_THRESHOLDS.demographicParity,
  });

  if (maxDiff > BIAS_THRESHOLDS.demographicParity) {
    flagged = true;
    recommendations.push(
      `Demographic parity violation detected: max difference of ${(maxDiff * 100).toFixed(1)}%`
    );
  }

  // Calculate equalized odds (TPR gap)
  const tprRates = groups.map((g) => g.truePositiveRate);
  const tprGap = Math.max(...tprRates) - Math.min(...tprRates);

  metrics.push({
    name: 'equalized_odds_tpr',
    description: 'Gap in true positive rates across groups',
    value: tprGap,
    threshold: BIAS_THRESHOLDS.equalizedOdds,
    isCompliant: tprGap <= BIAS_THRESHOLDS.equalizedOdds,
  });

  if (tprGap > BIAS_THRESHOLDS.equalizedOdds) {
    flagged = true;
  }

  // Calculate equalized odds (FPR gap)
  const fprRates = groups.map((g) => g.falsePositiveRate);
  const fprGap = Math.max(...fprRates) - Math.min(...fprRates);

  metrics.push({
    name: 'equalized_odds_fpr',
    description: 'Gap in false positive rates across groups',
    value: fprGap,
    threshold: BIAS_THRESHOLDS.equalizedOdds,
    isCompliant: fprGap <= BIAS_THRESHOLDS.equalizedOdds,
  });

  if (fprGap > BIAS_THRESHOLDS.equalizedOdds) {
    flagged = true;
    recommendations.push(
      `False positive rate disparity detected: max difference of ${(fprGap * 100).toFixed(1)}%`
    );
  }

  // Calculate disparate impact ratio (4/5ths rule)
  const maxPositiveRate = Math.max(...positiveRates);
  const minPositiveRate = Math.min(...positiveRates);
  const disparateImpactRatio = maxPositiveRate > 0 ? minPositiveRate / maxPositiveRate : 0;

  metrics.push({
    name: 'disparate_impact',
    description: 'Ratio of minimum to maximum positive rates (4/5ths rule)',
    value: disparateImpactRatio,
    threshold: BIAS_THRESHOLDS.disparateImpact,
    isCompliant: disparateImpactRatio >= BIAS_THRESHOLDS.disparateImpact,
  });

  if (disparateImpactRatio < BIAS_THRESHOLDS.disparateImpact) {
    flagged = true;
    recommendations.push(
      `Potential disparate impact: ratio of ${disparateImpactRatio.toFixed(3)} below threshold of ${BIAS_THRESHOLDS.disparateImpact}`
    );
  }

  // Calculate accuracy disparity
  const accuracies = groups.map((g) => g.accuracy);
  const accuracyGap = Math.max(...accuracies) - Math.min(...accuracies);

  metrics.push({
    name: 'accuracy_disparity',
    description: 'Gap in accuracy across groups',
    value: accuracyGap,
    threshold: 0.05,
    isCompliant: accuracyGap <= 0.05,
  });

  if (accuracyGap > 0.05) {
    flagged = true;
    recommendations.push(
      `Accuracy disparity detected: gap of ${(accuracyGap * 100).toFixed(1)}%`
    );
  }

  return { metrics, flagged, recommendations };
}

/**
 * Calculate demographic parity metrics
 */
function calculateDemographicParity(
  subgroupStats: Map<string, SubgroupStats>
): DemographicParityMetrics {
  const rates = Array.from(subgroupStats.values()).map((g) => g.predictedPositiveRate);
  const maxRate = Math.max(...rates);
  const minRate = Math.min(...rates);

  return {
    difference: maxRate - minRate,
    ratio: maxRate > 0 ? minRate / maxRate : 0,
    maxDifference: Math.max(...rates.map((r) => Math.abs(r - 0.5))),
  };
}

/**
 * Calculate equalized odds metrics
 */
function calculateEqualizedOdds(
  subgroupStats: Map<string, SubgroupStats>
): EqualizedOddsMetrics {
  const groups = Array.from(subgroupStats.values());
  const tprGap = new Map<string, number>();
  const fprGap = new Map<string, number>();

  const maxTPR = Math.max(...groups.map((g) => g.truePositiveRate));
  const maxFPR = Math.max(...groups.map((g) => g.falsePositiveRate));

  groups.forEach((g) => {
    tprGap.set(g.subgroup, maxTPR - g.truePositiveRate);
    fprGap.set(g.subgroup, maxFPR - g.falsePositiveRate);
  });

  return {
    truePositiveRateGap: tprGap,
    falsePositiveRateGap: fprGap,
    overallTPRGap: maxTPR - Math.min(...groups.map((g) => g.truePositiveRate)),
    overallFPRGap: maxFPR - Math.min(...groups.map((g) => g.falsePositiveRate)),
  };
}

/**
 * Calculate calibration metrics by group
 */
function calculateCalibrationMetrics(
  testData: TestDataPoint[],
  predictions: Array<{ output: unknown; confidence?: number }>
): CalibrationMetrics {
  const byGroup = new Map<string, { expected: number; actual: number; calibrationError: number }[]>();
  const bins = 10;

  testData.forEach((data, i) => {
    const group = getSensitiveAttributeValue(data, 'gender') || 'unknown';
    const confidence = predictions[i].confidence || 0.5;
    const binIndex = Math.min(Math.floor(confidence * bins), bins - 1);
    const isPositive = String(data.expected) === 'positive';

    if (!byGroup.has(group)) {
      byGroup.set(group, Array(bins).fill(null).map(() => ({ expected: 0, actual: 0, calibrationError: 0 })));
    }

    const groupBins = byGroup.get(group)!;
    groupBins[binIndex].expected += confidence;
    groupBins[binIndex].actual += isPositive ? 1 : 0;
  });

  // Calculate calibration error for each bin
  let totalECE = 0;
  let totalSamples = 0;

  byGroup.forEach((bins) => {
    const binSize = bins.reduce((sum, b) => sum + b.expected + b.actual, 0) / 2;
    bins.forEach((bin) => {
      const total = bin.expected + bin.actual;
      if (total > 0) {
        bin.calibrationError = Math.abs(bin.expected / total - bin.actual / total);
        totalECE += bin.calibrationError * total;
        totalSamples += total;
      }
    });
  });

  return {
    byGroup,
    overallECE: totalSamples > 0 ? totalECE / totalSamples : 0,
  };
}

/**
 * Calculate overall bias score
 */
function calculateOverallBiasScore(metrics: BiasMetric[]): number {
  if (metrics.length === 0) return 1.0;

  const compliantCount = metrics.filter((m) => m.isCompliant).length;
  return compliantCount / metrics.length;
}

/**
 * Get sensitive attribute value from test data point
 */
function getSensitiveAttributeValue(data: TestDataPoint, attrName: string): string {
  const metadata = data.metadata as Record<string, string> | undefined;
  return metadata?.[attrName] || 'unknown';
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(flaggedGroups: string[]): string[] {
  const recommendations: string[] = [];

  if (flaggedGroups.includes('gender')) {
    recommendations.push(
      'Consider implementing gender-aware training or applying post-processing calibration',
      'Review training data for historical gender bias',
      'Apply reweighting technique to balance training data'
    );
  }

  if (flaggedGroups.includes('age_group')) {
    recommendations.push(
      'Implement age-specific threshold adjustment',
      'Add age-specific features or interactions',
      'Consider ensemble methods with age-balanced models'
    );
  }

  if (flaggedGroups.includes('race')) {
    recommendations.push(
      'CRITICAL: Review data collection practices for racial representation',
      'Apply adversarial debiasing techniques',
      'Consider fairness constraints during model training'
    );
  }

  recommendations.push(
    'Run comprehensive bias audit before production deployment',
    'Implement ongoing monitoring for bias drift',
    'Consider using fairness-aware ML frameworks (e.g., Fairlearn, AI Fairness 360)'
  );

  return recommendations;
}

/**
 * Run bias detection on continuous basis
 */
export async function runContinuousBiasMonitoring(
  modelName: string,
  testData: TestDataPoint[],
  intervalMs: number = 300000
): Promise<BiasReport[]> {
  const reports: BiasReport[] = [];

  while (true) {
    const report = await detectBias(modelName, testData);
    reports.push(report);

    console.log(
      `[${report.timestamp}] Bias Report: Score=${report.overallScore.toFixed(3)}, ` +
        `Flagged=${report.flaggedGroups.join(', ') || 'None'}`
    );

    if (report.overallScore < 0.5) {
      console.warn(`WARNING: Bias score below threshold! Immediate review required.`);
    }

    await sleep(intervalMs);
  }
}

// Utility
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { BIAS_THRESHOLDS, SENSITIVE_ATTRIBUTES };
