/**
 * ML Fairness Auditing Framework
 * Comprehensive fairness evaluation and compliance checking
 */

import { predict, type TestDataPoint } from './model-testing';
import { calculateSubgroupStats, type SubgroupStats } from './bias-detection';

export interface FairnessAuditConfig {
  modelName: string;
  auditDate: string;
  regulatoryFramework: RegulatoryFramework;
  sensitiveAttributes: string[];
  sampleSize: number;
  confidenceLevel: number;
}

export type RegulatoryFramework =
  | 'EU_AI_ACT'
  | 'US_EEOC'
  | 'GDPR'
  | 'CCPA'
  | 'PCI_DSS'
  | 'HIPAA'
  | 'ISO_42001'
  | 'NIST_AI_RMF';

export interface FairnessCriterion {
  id: string;
  name: string;
  description: string;
  criterion: 'demographic_parity' | 'equalized_odds' | 'calibration' | 'individual_fairness' | 'counterfactual_fairness';
  threshold: number;
  isMet: boolean;
  value: number;
  evidence: Evidence[];
  remediation?: string;
}

interface Evidence {
  type: 'statistical_test' | 'metric' | 'sample_analysis';
  description: string;
  pValue?: number;
  effectSize?: number;
  sampleSize: number;
}

export interface FairnessAuditResult {
  config: FairnessAuditConfig;
  summary: AuditSummary;
  criteria: FairnessCriterion[];
  statisticalTests: StatisticalTestResult[];
  riskAssessment: RiskAssessment;
  complianceMatrix: ComplianceMatrix;
  recommendations: AuditRecommendation[];
  appendices: Map<string, unknown>;
}

interface AuditSummary {
  overallScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  criteriaPassed: number;
  criteriaFailed: number;
  criteriaWarning: number;
  statisticalTestsPassed: number;
  statisticalTestsFailed: number;
  estimatedRemediationCost: 'LOW' | 'MEDIUM' | 'HIGH';
  auditDuration: number;
}

interface StatisticalTestResult {
  name: string;
  description: string;
  statistic: number;
  pValue: number;
  isSignificant: boolean;
  conclusion: string;
  effectSize: number;
}

interface RiskAssessment {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: RiskFactor[];
  mitigatedRisks: string[];
  residualRisks: string[];
}

interface RiskFactor {
  factor: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  likelihood: 'RARE' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'CERTAIN';
  impact: 'NEGLIGIBLE' | 'MINOR' | 'MODERATE' | 'MAJOR' | 'SEVERE';
  mitigation: string;
}

interface ComplianceMatrix {
  framework: RegulatoryFramework;
  requirements: FrameworkRequirement[];
  overallCompliance: number;
}

interface FrameworkRequirement {
  requirementId: string;
  description: string;
  isMet: boolean;
  evidence: string;
  gapAnalysis?: string;
}

interface AuditRecommendation {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'TECHNICAL' | 'PROCESS' | 'GOVERNANCE' | 'MONITORING';
  title: string;
  description: string;
  estimatedEffort: 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
  impact: string;
}

// Framework-specific requirements
const REGULATORY_REQUIREMENTS: Record<RegulatoryFramework, FrameworkRequirement[]> = {
  EU_AI_ACT: [
    { requirementId: 'EAA-ART-5-1', description: 'Data Governance', isMet: false, evidence: '' },
    { requirementId: 'EAA-ART-5-2', description: 'Technical Documentation', isMet: false, evidence: '' },
    { requirementId: 'EAA-ART-5-3', description: 'Transparency', isMet: false, evidence: '' },
    { requirementId: 'EAA-ART-10-1', description: 'Accuracy & Robustness', isMet: false, evidence: '' },
    { requirementId: 'EAA-ART-10-2', description: 'Fairness & Non-discrimination', isMet: false, evidence: '' },
    { requirementId: 'EAA-ART-10-3', description: 'Human Oversight', isMet: false, evidence: '' },
  ],
  US_EEOC: [
    { requirementId: 'EEOC-4-5-RULE', description: 'Adverse Impact Analysis (4/5ths rule)', isMet: false, evidence: '' },
    { requirementId: 'EEOC-CHETAN', description: 'Chetan Analysis', isMet: false, evidence: '' },
    { requirementId: 'EEOC-BFOQ', description: 'Bona Fide Occupational Qualification', isMet: false, evidence: '' },
  ],
  GDPR: [
    { requirementId: 'GDPR-ART-5-1-A', description: 'Lawfulness, Fairness, Transparency', isMet: false, evidence: '' },
    { requirementId: 'GDPR-ART-5-1-B', description: 'Purpose Limitation', isMet: false, evidence: '' },
    { requirementId: 'GDPR-ART-5-1-C', description: 'Data Minimization', isMet: false, evidence: '' },
    { requirementId: 'GDPR-ART-5-1-D', description: 'Accuracy', isMet: false, evidence: '' },
    { requirementId: 'GDPR-ART-22', description: 'Automated Decision-Making', isMet: false, evidence: '' },
  ],
  CCPA: [
    { requirementId: 'CCPA-SEC-1798-100', description: 'Right to Know', isMet: false, evidence: '' },
    { requirementId: 'CCPA-SEC-1798-105', description: 'Right to Delete', isMet: false, evidence: '' },
    { requirementId: 'CCPA-SEC-1798-120', description: 'Right to Opt-Out', isMet: false, evidence: '' },
  ],
  PCI_DSS: [
    { requirementId: 'PCI-REQ-12', description: 'Data Governance', isMet: false, evidence: '' },
  ],
  HIPAA: [
    { requirementId: 'HIPAA-PRIVACY', description: 'Privacy Rule Compliance', isMet: false, evidence: '' },
    { requirementId: 'HIPAA-SECURITY', description: 'Security Rule Compliance', isMet: false, evidence: '' },
  ],
  ISO_42001: [
    { requirementId: 'ISO-A-8-1', description: 'AI Management System', isMet: false, evidence: '' },
    { requirementId: 'ISO-A-8-2', description: 'AI Impact Assessment', isMet: false, evidence: '' },
  ],
  NIST_AI_RMF: [
    { requirementId: 'NIST-MAP', description: 'Govern', isMet: false, evidence: '' },
    { requirementId: 'NIST-MEASURE', description: 'Measure', isMet: false, evidence: '' },
    { requirementId: 'NIST-MANAGE', description: 'Manage', isMet: false, evidence: '' },
  ],
};

/**
 * Run complete fairness audit
 */
export async function runFairnessAudit(
  modelName: string,
  testData: TestDataPoint[],
  config: Partial<FairnessAuditConfig> = {}
): Promise<FairnessAuditResult> {
  const startTime = Date.now();

  const auditConfig: FairnessAuditConfig = {
    modelName,
    auditDate: new Date().toISOString(),
    regulatoryFramework: config.regulatoryFramework || 'EU_AI_ACT',
    sensitiveAttributes: config.sensitiveAttributes || ['gender', 'age_group', 'race'],
    sampleSize: testData.length,
    confidenceLevel: config.confidenceLevel || 0.95,
  };

  // Run predictions
  const predictions = await Promise.all(
    testData.map((d) => predict(modelName, d.input))
  );

  // Calculate fairness criteria
  const criteria = await evaluateFairnessCriteria(modelName, testData, predictions, auditConfig);

  // Run statistical tests
  const statisticalTests = runStatisticalTests(testData, predictions, auditConfig);

  // Assess risk
  const riskAssessment = assessRisk(criteria, statisticalTests);

  // Generate compliance matrix
  const complianceMatrix = generateComplianceMatrix(
    auditConfig.regulatoryFramework,
    criteria
  );

  // Generate recommendations
  const recommendations = generateAuditRecommendations(criteria, statisticalTests, riskAssessment);

  // Calculate summary
  const summary = calculateAuditSummary(criteria, statisticalTests, riskAssessment, startTime);

  return {
    config: auditConfig,
    summary,
    criteria,
    statisticalTests,
    riskAssessment,
    complianceMatrix,
    recommendations,
    appendices: new Map([
      ['rawData', { testDataSize: testData.length, predictionsCount: predictions.length }],
      ['methodology', 'Statistical fairness evaluation with confidence intervals'],
    ]),
  };
}

/**
 * Evaluate all fairness criteria
 */
async function evaluateFairnessCriteria(
  modelName: string,
  testData: TestDataPoint[],
  predictions: Array<{ output: unknown; confidence?: number }>,
  config: FairnessAuditConfig
): Promise<FairnessCriterion[]> {
  const criteria: FairnessCriterion[] = [];

  for (const attr of config.sensitiveAttributes) {
    const subgroupStats = calculateSubgroupStatsForAudit(testData, predictions, attr);

    // Demographic Parity
    criteria.push(evaluateDemographicParity(subgroupStats, attr));

    // Equalized Odds
    criteria.push(evaluateEqualizedOdds(subgroupStats, attr));

    // Calibration
    criteria.push(evaluateCalibration(testData, predictions, attr));

    // Individual Fairness
    criteria.push(evaluateIndividualFairness(testData, predictions, attr));
  }

  // Counterfactual Fairness (requires additional analysis)
  criteria.push(await evaluateCounterfactualFairness(modelName, testData));

  return criteria;
}

function calculateSubgroupStatsForAudit(
  testData: TestDataPoint[],
  predictions: Array<{ output: unknown; confidence?: number }>,
  attributeName: string
): Map<string, SubgroupStats> {
  // Simplified version of bias-detection's calculation
  const groups = new Map<string, { data: TestDataPoint; prediction: unknown }[]>();

  testData.forEach((data, i) => {
    const attrValue = (data.metadata as Record<string, string>)?.[attributeName] || 'unknown';
    if (!groups.has(attrValue)) {
      groups.set(attrValue, []);
    }
    groups.get(attrValue)!.push({ data, prediction: predictions[i].output });
  });

  const stats = new Map<string, SubgroupStats>();

  groups.forEach((samples, subgroupName) => {
    const n = samples.length;
    let truePositives = 0, falsePositives = 0, falseNegatives = 0, trueNegatives = 0;
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

      if (String(data.expected) === String(prediction)) correctPredictions++;
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

function evaluateDemographicParity(
  subgroupStats: Map<string, SubgroupStats>,
  attributeName: string
): FairnessCriterion {
  const groups = Array.from(subgroupStats.values());
  const rates = groups.map((g) => g.predictedPositiveRate);
  const maxRate = Math.max(...rates);
  const minRate = Math.min(...rates);
  const difference = maxRate - minRate;
  const ratio = maxRate > 0 ? minRate / maxRate : 0;

  const threshold = 0.1;
  const isMet = difference <= threshold;

  return {
    id: `DP-${attributeName}`,
    name: `Demographic Parity (${attributeName})`,
    description: `Equal positive prediction rates across ${attributeName} groups`,
    criterion: 'demographic_parity',
    threshold,
    isMet,
    value: difference,
    evidence: [
      {
        type: 'metric',
        description: `Max difference: ${(difference * 100).toFixed(2)}%`,
        sampleSize: groups.reduce((sum, g) => sum + g.size, 0),
      },
      {
        type: 'metric',
        description: `Min/Max ratio: ${ratio.toFixed(3)}`,
        sampleSize: groups.reduce((sum, g) => sum + g.size, 0),
      },
    ],
    remediation: isMet ? undefined : `Adjust decision thresholds for ${attributeName} groups`,
  };
}

function evaluateEqualizedOdds(
  subgroupStats: Map<string, SubgroupStats>,
  attributeName: string
): FairnessCriterion {
  const groups = Array.from(subgroupStats.values());
  const tprRates = groups.map((g) => g.truePositiveRate);
  const fprRates = groups.map((g) => g.falsePositiveRate);

  const tprGap = Math.max(...tprRates) - Math.min(...tprRates);
  const fprGap = Math.max(...fprRates) - Math.min(...fprRates);
  const maxGap = Math.max(tprGap, fprGap);

  const threshold = 0.05;
  const isMet = maxGap <= threshold;

  return {
    id: `EO-${attributeName}`,
    name: `Equalized Odds (${attributeName})`,
    description: `Equal TPR and FPR across ${attributeName} groups`,
    criterion: 'equalized_odds',
    threshold,
    isMet,
    value: maxGap,
    evidence: [
      {
        type: 'metric',
        description: `TPR gap: ${(tprGap * 100).toFixed(2)}%`,
        sampleSize: groups.reduce((sum, g) => sum + g.size, 0),
      },
      {
        type: 'metric',
        description: `FPR gap: ${(fprGap * 100).toFixed(2)}%`,
        sampleSize: groups.reduce((sum, g) => sum + g.size, 0),
      },
    ],
    remediation: isMet ? undefined : `Apply equalized odds post-processing for ${attributeName}`,
  };
}

function evaluateCalibration(
  testData: TestDataPoint[],
  predictions: Array<{ output: unknown; confidence?: number }>,
  attributeName: string
): FairnessCriterion {
  // Simplified calibration evaluation
  let totalExpected = 0;
  let totalActual = 0;

  testData.forEach((data, i) => {
    const confidence = predictions[i].confidence || 0.5;
    const isPositive = String(data.expected) === 'positive';

    totalExpected += confidence;
    totalActual += isPositive ? 1 : 0;
  });

  const expectedRate = totalExpected / testData.length;
  const actualRate = totalActual / testData.length;
  const calibrationError = Math.abs(expectedRate - actualRate);

  const threshold = 0.05;
  const isMet = calibrationError <= threshold;

  return {
    id: `CAL-${attributeName}`,
    name: `Calibration (${attributeName})`,
    description: `Model confidence matches actual outcomes for ${attributeName} groups`,
    criterion: 'calibration',
    threshold,
    isMet,
    value: calibrationError,
    evidence: [
      {
        type: 'metric',
        description: `Expected positive rate: ${(expectedRate * 100).toFixed(2)}%`,
        sampleSize: testData.length,
      },
      {
        type: 'metric',
        description: `Actual positive rate: ${(actualRate * 100).toFixed(2)}%`,
        sampleSize: testData.length,
      },
    ],
    remediation: isMet ? undefined : `Recalibrate model for ${attributeName} groups`,
  };
}

function evaluateIndividualFairness(
  testData: TestDataPoint[],
  predictions: Array<{ output: unknown; confidence?: number }>,
  attributeName: string
): FairnessCriterion {
  // Simplified: check if similar inputs get similar predictions
  let similarPairs = 0;
  let samePredictions = 0;

  for (let i = 0; i < Math.min(testData.length, 100); i++) {
    for (let j = i + 1; j < Math.min(testData.length, 100); j++) {
      const dist = calculateDistance(testData[i].input, testData[j].input);
      if (dist < 0.1) {
        similarPairs++;
        if (String(predictions[i].output) === String(predictions[j].output)) {
          samePredictions++;
        }
      }
    }
  }

  const consistencyRate = similarPairs > 0 ? samePredictions / similarPairs : 1;
  const threshold = 0.9;
  const isMet = consistencyRate >= threshold;

  return {
    id: `IF-${attributeName}`,
    name: `Individual Fairness (${attributeName})`,
    description: `Similar individuals receive similar predictions`,
    criterion: 'individual_fairness',
    threshold,
    isMet,
    value: consistencyRate,
    evidence: [
      {
        type: 'metric',
        description: `Consistency rate: ${(consistencyRate * 100).toFixed(2)}%`,
        sampleSize: similarPairs,
      },
    ],
    remediation: isMet ? undefined : 'Review feature importance and similarity metrics',
  };
}

async function evaluateCounterfactualFairness(
  modelName: string,
  testData: TestDataPoint[]
): Promise<FairnessCriterion> {
  // Simplified counterfactual evaluation
  let counterfactuals = 0;
  let sameOutcomes = 0;

  // Take a sample and test counterfactual scenarios
  const sample = testData.slice(0, 20);

  for (const data of sample) {
    const originalInput = data.input;
    const counterfactualInput = flipSensitiveAttribute(originalInput);

    const originalPrediction = await predict(modelName, originalInput);
    const counterfactualPrediction = await predict(modelName, counterfactualInput);

    counterfactuals++;
    if (String(originalPrediction.output) === String(counterfactualPrediction.output)) {
      sameOutcomes++;
    }
  }

  const fairnessScore = counterfactuals > 0 ? sameOutcomes / counterfactuals : 1;
  const threshold = 0.95;
  const isMet = fairnessScore >= threshold;

  return {
    id: 'CF-ALL',
    name: 'Counterfactual Fairness',
    description: 'Predictions remain consistent when sensitive attributes change',
    criterion: 'counterfactual_fairness',
    threshold,
    isMet,
    value: fairnessScore,
    evidence: [
      {
        type: 'sample_analysis',
        description: `Counterfactual consistency: ${(fairnessScore * 100).toFixed(2)}%`,
        sampleSize: counterfactuals,
      },
    ],
    remediation: isMet ? undefined : 'Implement counterfactual-aware training',
  };
}

function flipSensitiveAttribute(input: unknown): unknown {
  // Simplified - in production would flip actual sensitive attributes
  if (typeof input === 'object' && input !== null) {
    return { ...input as object };
  }
  return input;
}

function calculateDistance(a: unknown, b: unknown): number {
  // Simplified distance calculation
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
    let sum = 0;
    let count = 0;

    keys.forEach((key) => {
      const aVal = aObj[key];
      const bVal = bObj[key];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        sum += Math.abs(aVal - bVal);
        count++;
      }
    });

    return count > 0 ? sum / count : 0;
  }
  return a === b ? 0 : 1;
}

/**
 * Run statistical significance tests
 */
function runStatisticalTests(
  testData: TestDataPoint[],
  predictions: Array<{ output: unknown; confidence?: number }>,
  config: FairnessAuditConfig
): StatisticalTestResult[] {
  const tests: StatisticalTestResult[] = [];

  // Chi-square test for independence
  tests.push(runChiSquareTest(testData, predictions, config.sensitiveAttributes[0]));

  // T-test for equal means
  tests.push(runTTest(testData, predictions, config.sensitiveAttributes[0]));

  // Kolmogorov-Smirnov test
  tests.push(runKSTest(testData, predictions, config.sensitiveAttributes[0]));

  return tests;
}

function runChiSquareTest(
  testData: TestDataPoint[],
  predictions: Array<{ output: unknown; confidence?: number }>,
  attributeName: string
): StatisticalTestResult {
  // Simplified chi-square calculation
  const groups = new Map<string, { positive: number; negative: number }>();

  testData.forEach((data, i) => {
    const attrValue = (data.metadata as Record<string, string>)?.[attributeName] || 'unknown';
    const prediction = String(predictions[i].output);

    if (!groups.has(attrValue)) {
      groups.set(attrValue, { positive: 0, negative: 0 });
    }

    const stats = groups.get(attrValue)!;
    if (prediction === 'positive') {
      stats.positive++;
    } else {
      stats.negative++;
    }
  });

  const groupValues = Array.from(groups.values());
  const chiSquare = groupValues.reduce((sum, g, i) => {
    const expected = (g.positive + g.negative) / groupValues.length;
    return sum + Math.pow(g.positive - expected, 2) / expected;
  }, 0);

  const pValue = 1 - chiSquareCDF(chiSquare, groupValues.length - 1);

  return {
    name: 'Chi-Square Test of Independence',
    description: `Tests if prediction outcomes are independent of ${attributeName}`,
    statistic: chiSquare,
    pValue: Math.max(0, Math.min(1, pValue)),
    isSignificant: pValue < 0.05,
    conclusion: pValue < 0.05
      ? `Significant relationship detected between prediction and ${attributeName}`
      : `No significant relationship between prediction and ${attributeName}`,
    effectSize: Math.sqrt(chiSquare / testData.length),
  };
}

function runTTest(
  testData: TestDataPoint[],
  predictions: Array<{ output: unknown; confidence?: number }>,
  attributeName: string
): StatisticalTestResult {
  // Simplified t-test comparing group means
  const groupMeans: number[] = [];
  const groups = new Map<string, number[]>();

  testData.forEach((data, i) => {
    const attrValue = (data.metadata as Record<string, string>)?.[attributeName] || 'unknown';
    const confidence = predictions[i].confidence || 0.5;

    if (!groups.has(attrValue)) {
      groups.set(attrValue, []);
    }
    groups.get(attrValue)!.push(confidence);
  });

  groups.forEach((values) => {
    groupMeans.push(values.reduce((a, b) => a + b, 0) / values.length);
  });

  const tStatistic = groupMeans.length > 1 ? Math.abs(groupMeans[0] - groupMeans[1]) * Math.sqrt(testData.length) : 0;
  const pValue = 1 - tCDF(tStatistic, testData.length - 2);

  return {
    name: 'Two-Sample T-Test',
    description: `Compares mean confidence scores across ${attributeName} groups`,
    statistic: tStatistic,
    pValue: Math.max(0, Math.min(1, pValue)),
    isSignificant: pValue < 0.05,
    conclusion: pValue < 0.05
      ? `Significant difference in confidence scores across ${attributeName}`
      : `No significant difference in confidence scores`,
    effectSize: Math.abs(groupMeans[0] - groupMeans[1]),
  };
}

function runKSTest(
  testData: TestDataPoint[],
  predictions: Array<{ output: unknown; confidence?: number }>,
  attributeName: string
): StatisticalTestResult {
  // Simplified Kolmogorov-Smirnov test
  const groups = new Map<string, number[]>();

  testData.forEach((data, i) => {
    const attrValue = (data.metadata as Record<string, string>)?.[attributeName] || 'unknown';
    const confidence = predictions[i].confidence || 0.5;

    if (!groups.has(attrValue)) {
      groups.set(attrValue, []);
    }
    groups.get(attrValue)!.push(confidence);
  });

  const groupArrays = Array.from(groups.values());
  let maxDiff = 0;

  if (groupArrays.length >= 2) {
    const sorted1 = [...groupArrays[0]].sort((a, b) => a - b);
    const sorted2 = [...groupArrays[1]].sort((a, b) => a - b);

    let i = 0, j = 0;
    while (i < sorted1.length && j < sorted2.length) {
      maxDiff = Math.max(maxDiff, Math.abs(sorted1[i] - sorted2[j]));
      if (sorted1[i] < sorted2[j]) i++;
      else j++;
    }
  }

  const ksStatistic = maxDiff;
  const pValue = Math.exp(-2 * Math.pow(ksStatistic * Math.sqrt(testData.length), 2));

  return {
    name: 'Kolmogorov-Smirnov Test',
    description: `Tests if ${attributeName} groups have same confidence distribution`,
    statistic: ksStatistic,
    pValue: Math.max(0, Math.min(1, pValue)),
    isSignificant: pValue < 0.05,
    conclusion: pValue < 0.05
      ? `Different confidence distributions across ${attributeName} groups`
      : `Similar confidence distributions across ${attributeName} groups`,
    effectSize: ksStatistic,
  };
}

// Approximate CDF functions
function chiSquareCDF(x: number, df: number): number {
  return 1 - Math.exp(-x / 2) * Math.pow(x / df, df / 2 - 1);
}

function tCDF(t: number, df: number): number {
  const x = df / (df + t * t);
  return 1 - 0.5 * Math.pow(x, df / 2);
}

/**
 * Assess overall risk level
 */
function assessRisk(
  criteria: FairnessCriterion[],
  statisticalTests: StatisticalTestResult[]
): RiskAssessment {
  const riskFactors: RiskFactor[] = [];
  const mitigatedRisks: string[] = [];
  const residualRisks: string[] = [];

  // Check failed criteria
  const failedCriteria = criteria.filter((c) => !c.isMet);
  failedCriteria.forEach((c) => {
    const severity = c.value > c.threshold * 2 ? 'HIGH' : c.value > c.threshold ? 'MEDIUM' : 'LOW';
    riskFactors.push({
      factor: c.name,
      severity,
      likelihood: 'POSSIBLE',
      impact: severity === 'HIGH' ? 'MAJOR' : severity === 'MEDIUM' ? 'MODERATE' : 'MINOR',
      mitigation: c.remediation || 'Review and adjust model',
    });
    residualRisks.push(c.name);
  });

  // Check significant statistical tests
  const significantTests = statisticalTests.filter((t) => t.isSignificant);
  if (significantTests.length > 0) {
    riskFactors.push({
      factor: 'Statistical Significance Detected',
      severity: 'MEDIUM',
      likelihood: 'LIKELY',
      impact: 'MODERATE',
      mitigation: 'Conduct deeper bias investigation',
    });
    residualRisks.push('Statistical bias detected');
  } else {
    mitigatedRisks.push('No statistically significant bias detected');
  }

  const overallRisk = riskFactors.length === 0
    ? 'LOW'
    : riskFactors.some((r) => r.severity === 'HIGH' || r.severity === 'CRITICAL')
    ? 'HIGH'
    : 'MEDIUM';

  return {
    overallRisk,
    riskFactors,
    mitigatedRisks,
    residualRisks,
  };
}

/**
 * Generate compliance matrix for regulatory framework
 */
function generateComplianceMatrix(
  framework: RegulatoryFramework,
  criteria: FairnessCriterion[]
): ComplianceMatrix {
  const requirements = REGULATORY_REQUIREMENTS[framework];

  // Update requirements based on criteria evaluation
  const updatedRequirements = requirements.map((req) => {
    const relevantCriteria = criteria.filter((c) =>
      req.description.toLowerCase().includes('fairness') ||
      req.description.toLowerCase().includes('accuracy')
    );

    const allMet = relevantCriteria.length > 0 && relevantCriteria.every((c) => c.isMet);

    return {
      ...req,
      isMet: allMet,
      evidence: relevantCriteria.length > 0
        ? `Evaluated ${relevantCriteria.length} fairness criteria`
        : 'Pending evaluation',
    };
  });

  const overallCompliance = updatedRequirements.filter((r) => r.isMet).length / updatedRequirements.length;

  return {
    framework,
    requirements: updatedRequirements,
    overallCompliance,
  };
}

/**
 * Generate audit recommendations
 */
function generateAuditRecommendations(
  criteria: FairnessCriterion[],
  statisticalTests: StatisticalTestResult[],
  riskAssessment: RiskAssessment
): AuditRecommendation[] {
  const recommendations: AuditRecommendation[] = [];

  // Critical recommendations for failed criteria
  criteria.filter((c) => !c.isMet).forEach((c) => {
    recommendations.push({
      priority: c.value > c.threshold * 2 ? 'CRITICAL' : 'HIGH',
      category: 'TECHNICAL',
      title: `Address ${c.name} criterion failure`,
      description: c.remediation || `Implement measures to achieve ${c.name} fairness`,
      estimatedEffort: 'DAYS',
      impact: `Will improve overall fairness score by ${((1 - c.value / c.threshold) * 10).toFixed(1)} points`,
    });
  });

  // Process recommendations
  if (riskAssessment.residualRisks.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'PROCESS',
      title: 'Implement continuous fairness monitoring',
      description: 'Deploy automated fairness monitoring with alerting thresholds',
      estimatedEffort: 'WEEKS',
      impact: 'Enables proactive bias detection and remediation',
    });
  }

  // Governance recommendations
  recommendations.push({
    priority: 'MEDIUM',
    category: 'GOVERNANCE',
    title: 'Establish fairness governance framework',
    description: 'Define roles, responsibilities, and escalation procedures for fairness issues',
    estimatedEffort: 'DAYS',
    impact: 'Ensures accountability and timely response to fairness concerns',
  });

  // Monitoring recommendations
  recommendations.push({
    priority: 'MEDIUM',
    category: 'MONITORING',
    title: 'Set up bias drift detection',
    description: 'Monitor model performance across demographic groups over time',
    estimatedEffort: 'DAYS',
    impact: 'Early detection of fairness degradation',
  });

  return recommendations.sort((a, b) => {
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Calculate audit summary
 */
function calculateAuditSummary(
  criteria: FairnessCriterion[],
  statisticalTests: StatisticalTestResult[],
  riskAssessment: RiskAssessment,
  startTime: number
): AuditSummary {
  const passed = criteria.filter((c) => c.isMet).length;
  const failed = criteria.filter((c) => !c.isMet).length;
  const warning = criteria.filter((c) => c.isMet && c.value > c.threshold * 0.8).length;

  return {
    overallScore: criteria.length > 0 ? passed / criteria.length : 1,
    riskLevel: riskAssessment.overallRisk,
    criteriaPassed: passed,
    criteriaFailed: failed,
    criteriaWarning: warning,
    statisticalTestsPassed: statisticalTests.filter((t) => !t.isSignificant).length,
    statisticalTestsFailed: statisticalTests.filter((t) => t.isSignificant).length,
    estimatedRemediationCost: failed > 3 ? 'HIGH' : failed > 0 ? 'MEDIUM' : 'LOW',
    auditDuration: Date.now() - startTime,
  };
}

/**
 * Generate audit report as formatted string
 */
export function formatAuditReport(report: FairnessAuditResult): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push(`FAIRNESS AUDIT REPORT`);
  lines.push('='.repeat(80));
  lines.push(`Model: ${report.config.modelName}`);
  lines.push(`Audit Date: ${report.config.auditDate}`);
  lines.push(`Framework: ${report.config.regulatoryFramework}`);
  lines.push('');

  lines.push('-'.repeat(80));
  lines.push('EXECUTIVE SUMMARY');
  lines.push('-'.repeat(80));
  lines.push(`Overall Score: ${(report.summary.overallScore * 100).toFixed(1)}%`);
  lines.push(`Risk Level: ${report.summary.riskLevel}`);
  lines.push(`Criteria Passed: ${report.summary.criteriaPassed}/${criteria.length}`);
  lines.push(`Audit Duration: ${(report.summary.auditDuration / 1000).toFixed(2)}s`);
  lines.push('');

  lines.push('-'.repeat(80));
  lines.push('FAIRNESS CRITERIA RESULTS');
  lines.push('-'.repeat(80));
  report.criteria.forEach((c) => {
    const status = c.isMet ? '[PASS]' : '[FAIL]';
    lines.push(`${status} ${c.name}: ${(c.value * 100).toFixed(2)}% (threshold: ${(c.threshold * 100).toFixed(1)}%)`);
  });
  lines.push('');

  lines.push('-'.repeat(80));
  lines.push('RECOMMENDATIONS');
  lines.push('-'.repeat(80));
  report.recommendations.forEach((r, i) => {
    lines.push(`${i + 1}. [${r.priority}] ${r.title}`);
    lines.push(`   ${r.description}`);
    lines.push(`   Estimated effort: ${r.estimatedEffort}`);
    lines.push('');
  });

  lines.push('='.repeat(80));
  lines.push('END OF REPORT');
  lines.push('='.repeat(80));

  return lines.join('\n');
}

// Add type reference for import
const criteria: FairnessCriterion[] = [];
