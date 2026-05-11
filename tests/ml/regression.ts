/**
 * ML Regression Testing Framework
 * Detects performance regressions in ML models
 */

import { predict, type TestDataPoint, type PredictionResult, calculateMetrics } from './model-testing';

export interface RegressionTestResult {
  model: string;
  version: string;
  previousVersion: string;
  timestamp: string;
  overallPassed: boolean;
  regressions: RegressionFinding[];
  improvements: ImprovementFinding[];
  metrics: MetricsComparison;
  canaries: CanaryTestResult[];
}

export interface RegressionFinding {
  metric: string;
  previousValue: number;
  currentValue: number;
  absoluteChange: number;
  relativeChange: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface ImprovementFinding {
  metric: string;
  previousValue: number;
  currentValue: number;
  absoluteChange: number;
  relativeChange: number;
  significance: 'MAJOR' | 'MINOR';
  description: string;
}

interface MetricsComparison {
  accuracy: MetricComparison;
  precision: MetricComparison;
  recall: MetricComparison;
  f1: MetricComparison;
  latency: MetricComparison;
  customMetrics: Map<string, MetricComparison>;
}

interface MetricComparison {
  previousValue: number;
  currentValue: number;
  absoluteChange: number;
  relativeChange: number;
  threshold: number;
  isRegressed: boolean;
}

interface CanaryTestResult {
  name: string;
  previousPassRate: number;
  currentPassRate: number;
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING' | 'CRITICAL';
  alert: boolean;
}

export interface BaselineMetrics {
  version: string;
  timestamp: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    latency: number;
    throughput?: number;
    memoryUsage?: number;
  };
  testResults: Array<{
    testName: string;
    passRate: number;
    averageLatency: number;
  }>;
  datasetHash: string;
  modelHash: string;
}

// Thresholds for regression detection
const REGRESSION_THRESHOLDS = {
  accuracy: { absolute: -0.01, relative: -0.02 },
  precision: { absolute: -0.02, relative: -0.05 },
  recall: { absolute: -0.02, relative: -0.05 },
  f1: { absolute: -0.02, relative: -0.05 },
  latency: { absolute: 10, relative: 0.1 }, // 10ms or 10% increase
  passRate: { absolute: -0.05, relative: -0.05 },
};

// Baseline storage
const baselines: Map<string, BaselineMetrics> = new Map();

/**
 * Register a new baseline for comparison
 */
export function registerBaseline(
  model: string,
  metrics: BaselineMetrics
): void {
  baselines.set(model, metrics);
  console.log(`Registered baseline for ${model}: accuracy=${metrics.metrics.accuracy.toFixed(4)}`);
}

/**
 * Get current baseline for a model
 */
export function getBaseline(model: string): BaselineMetrics | undefined {
  return baselines.get(model);
}

/**
 * Create baseline from current model run
 */
export async function createBaseline(
  modelName: string,
  version: string,
  testData: TestDataPoint[],
  options?: {
    datasetHash?: string;
    modelHash?: string;
    customMetrics?: Record<string, number>;
  }
): Promise<BaselineMetrics> {
  const predictions = await runPredictions(modelName, testData);
  const metrics = calculateMetrics(testData, predictions);

  // Run canary tests
  const canaryResults = await runCanaryTests(modelName, testData);

  const baseline: BaselineMetrics = {
    version,
    timestamp: new Date().toISOString(),
    metrics: {
      accuracy: metrics.accuracy,
      precision: metrics.precision,
      recall: metrics.recall,
      f1: metrics.f1,
      latency: metrics.latency,
      throughput: testData.length / (metrics.latency / 1000),
    },
    testResults: canaryResults.map((c) => ({
      testName: c.name,
      passRate: c.currentPassRate,
      averageLatency: 0,
    })),
    datasetHash: options?.datasetHash || hashDataset(testData),
    modelHash: options?.modelHash || 'unknown',
  };

  registerBaseline(modelName, baseline);
  return baseline;
}

/**
 * Run regression tests against baseline
 */
export async function testForRegression(
  modelName: string,
  testData: TestDataPoint[],
  options?: {
    previousVersion?: string;
    customThresholds?: Partial<typeof REGRESSION_THRESHOLDS>;
    canaryTests?: CanaryTest[];
  }
): Promise<RegressionTestResult> {
  const startTime = Date.now();
  const thresholds = { ...REGRESSION_THRESHOLDS, ...options?.customThresholds };

  // Get baseline
  const baseline = baselines.get(modelName);
  if (!baseline) {
    throw new Error(`No baseline registered for model ${modelName}. Run createBaseline first.`);
  }

  // Run predictions
  const predictions = await runPredictions(modelName, testData);
  const currentMetrics = calculateMetrics(testData, predictions);

  // Calculate metrics comparison
  const metricsComparison = compareMetrics(baseline, currentMetrics, thresholds);

  // Detect regressions
  const regressions = detectRegressions(metricsComparison);

  // Detect improvements
  const improvements = detectImprovements(metricsComparison);

  // Run canary tests
  const canaryTests = options?.canaryTests || getDefaultCanaryTests();
  const canaryResults = await runCanaryTestsWithComparison(
    modelName,
    testData,
    baseline,
    canaryTests
  );

  return {
    model: modelName,
    version: 'current',
    previousVersion: baseline.version,
    timestamp: new Date().toISOString(),
    overallPassed: regressions.filter((r) => r.severity === 'CRITICAL' || r.severity === 'HIGH').length === 0,
    regressions,
    improvements,
    metrics: metricsComparison,
    canaries: canaryResults,
  };
}

/**
 * Run regression tests in CI/CD pipeline
 */
export async function runCIRegressionTests(
  modelName: string,
  testData: TestDataPoint[],
  options?: {
    failOnCritical?: boolean;
    failOnHigh?: boolean;
    customThresholds?: Partial<typeof REGRESSION_THRESHOLDS>;
  }
): Promise<{
  passed: boolean;
  summary: string;
  exitCode: number;
}> {
  const result = await testForRegression(modelName, testData, options);

  // Generate summary
  const criticalRegressions = result.regressions.filter((r) => r.severity === 'CRITICAL');
  const highRegressions = result.regressions.filter((r) => r.severity === 'HIGH');
  const mediumRegressions = result.regressions.filter((r) => r.severity === 'MEDIUM');
  const lowRegressions = result.regressions.filter((r) => r.severity === 'LOW');

  const lines: string[] = [];
  lines.push('='.repeat(60));
  lines.push('REGRESSION TEST RESULTS');
  lines.push('='.repeat(60));
  lines.push(`Model: ${result.model}`);
  lines.push(`Baseline: ${result.previousVersion}`);
  lines.push(`Timestamp: ${result.timestamp}`);
  lines.push('');

  if (result.regressions.length > 0) {
    lines.push('REGRESSIONS DETECTED:');
    lines.push('-'.repeat(60));

    if (criticalRegressions.length > 0) {
      lines.push(`CRITICAL (${criticalRegressions.length}):`);
      criticalRegressions.forEach((r) => {
        lines.push(`  - ${r.metric}: ${(r.previousValue * 100).toFixed(2)}% -> ${(r.currentValue * 100).toFixed(2)}% (${(r.relativeChange * 100).toFixed(1)}%)`);
      });
    }

    if (highRegressions.length > 0) {
      lines.push(`HIGH (${highRegressions.length}):`);
      highRegressions.forEach((r) => {
        lines.push(`  - ${r.metric}: ${(r.previousValue * 100).toFixed(2)}% -> ${(r.currentValue * 100).toFixed(2)}% (${(r.relativeChange * 100).toFixed(1)}%)`);
      });
    }

    if (mediumRegressions.length > 0) {
      lines.push(`MEDIUM (${mediumRegressions.length}):`);
      mediumRegressions.forEach((r) => {
        lines.push(`  - ${r.metric}: ${(r.previousValue * 100).toFixed(2)}% -> ${(r.currentValue * 100).toFixed(2)}% (${(r.relativeChange * 100).toFixed(1)}%)`);
      });
    }

    if (lowRegressions.length > 0) {
      lines.push(`LOW (${lowRegressions.length}):`);
      lowRegressions.forEach((r) => {
        lines.push(`  - ${r.metric}: ${(r.previousValue * 100).toFixed(2)}% -> ${(r.currentValue * 100).toFixed(2)}% (${(r.relativeChange * 100).toFixed(1)}%)`);
      });
    }
  } else {
    lines.push('NO REGRESSIONS DETECTED');
  }

  if (result.improvements.length > 0) {
    lines.push('');
    lines.push('IMPROVEMENTS:');
    lines.push('-'.repeat(60));
    result.improvements.forEach((i) => {
      lines.push(`  + ${i.metric}: ${(i.previousValue * 100).toFixed(2)}% -> ${(i.currentValue * 100).toFixed(2)}% (${(i.relativeChange * 100).toFixed(1)}%)`);
    });
  }

  lines.push('');
  lines.push('OVERALL RESULT: ' + (result.overallPassed ? 'PASSED' : 'FAILED'));
  lines.push('='.repeat(60));

  // Determine exit code
  let exitCode = 0;
  if (criticalRegressions.length > 0) {
    exitCode = 2;
  } else if (options?.failOnHigh && highRegressions.length > 0) {
    exitCode = 1;
  } else if (!result.overallPassed) {
    exitCode = 1;
  }

  return {
    passed: exitCode === 0,
    summary: lines.join('\n'),
    exitCode,
  };
}

// ============== Canary Testing ==============

export interface CanaryTest {
  name: string;
  testFunction: (data: TestDataPoint, prediction: PredictionResult) => boolean;
  description: string;
}

function getDefaultCanaryTests(): CanaryTest[] {
  return [
    {
      name: 'basic_accuracy',
      testFunction: (data, prediction) =>
        String(data.expected) === String(prediction.output),
      description: 'Basic accuracy check',
    },
    {
      name: 'confidence_threshold',
      testFunction: (data, prediction) =>
        (prediction.confidence || 0) >= 0.5,
      description: 'Confidence score above threshold',
    },
    {
      name: 'latency_sla',
      testFunction: (data, prediction) =>
        prediction.latency < 100,
      description: 'Latency within SLA',
    },
    {
      name: 'no_null_output',
      testFunction: (data, prediction) =>
        prediction.output !== null && prediction.output !== undefined,
      description: 'Output is not null',
    },
    {
      name: 'valid_output_range',
      testFunction: (data, prediction) => {
        const validOutputs = ['positive', 'negative'];
        return validOutputs.includes(String(prediction.output));
      },
      description: 'Output is in valid range',
    },
  ];
}

async function runCanaryTests(
  modelName: string,
  testData: TestDataPoint[]
): Promise<CanaryTestResult[]> {
  const canaryTests = getDefaultCanaryTests();
  const predictions = await runPredictions(modelName, testData);

  return canaryTests.map((test) => {
    let passed = 0;
    predictions.forEach((prediction, i) => {
      if (test.testFunction(testData[i], prediction)) {
        passed++;
      }
    });

    return {
      name: test.name,
      previousPassRate: 1.0,
      currentPassRate: passed / predictions.length,
      trend: 'STABLE' as const,
      alert: passed / predictions.length < 0.95,
    };
  });
}

async function runCanaryTestsWithComparison(
  modelName: string,
  testData: TestDataPoint[],
  baseline: BaselineMetrics,
  canaryTests: CanaryTest[]
): Promise<CanaryTestResult[]> {
  const predictions = await runPredictions(modelName, testData);

  return canaryTests.map((test, index) => {
    let passed = 0;
    predictions.forEach((prediction, i) => {
      if (test.testFunction(testData[i], prediction)) {
        passed++;
      }
    });

    const currentPassRate = passed / predictions.length;
    const previousPassRate = baseline.testResults[index]?.passRate || 1.0;
    const change = currentPassRate - previousPassRate;

    let trend: CanaryTestResult['trend'];
    let alert = false;

    if (change > 0.01) {
      trend = 'IMPROVING';
    } else if (change < -0.05) {
      trend = 'CRITICAL';
      alert = true;
    } else if (change < -0.01) {
      trend = 'DEGRADING';
      alert = currentPassRate < 0.95;
    } else {
      trend = 'STABLE';
    }

    return {
      name: test.name,
      previousPassRate,
      currentPassRate,
      trend,
      alert,
    };
  });
}

// ============== Helper Functions ==============

async function runPredictions(
  modelName: string,
  testData: TestDataPoint[]
): Promise<PredictionResult[]> {
  return Promise.all(testData.map((d) => predict(modelName, d.input)));
}

function compareMetrics(
  baseline: BaselineMetrics,
  current: ReturnType<typeof calculateMetrics>,
  thresholds: typeof REGRESSION_THRESHOLDS
): MetricsComparison {
  const compare = (
    prev: number,
    curr: number,
    threshold: { absolute: number; relative: number }
  ): MetricComparison => {
    const absoluteChange = curr - prev;
    const relativeChange = prev !== 0 ? (curr - prev) / prev : 0;
    const isRegressed = absoluteChange < threshold.absolute || relativeChange < threshold.relative;

    return {
      previousValue: prev,
      currentValue: curr,
      absoluteChange,
      relativeChange,
      threshold: Math.abs(threshold.absolute),
      isRegressed,
    };
  };

  return {
    accuracy: compare(baseline.metrics.accuracy, current.accuracy, thresholds.accuracy),
    precision: compare(baseline.metrics.precision, current.precision, thresholds.precision),
    recall: compare(baseline.metrics.recall, current.recall, thresholds.recall),
    f1: compare(baseline.metrics.f1, current.f1, thresholds.f1),
    latency: compare(baseline.metrics.latency, current.latency, thresholds.latency),
    customMetrics: new Map(),
  };
}

function detectRegressions(metricsComparison: MetricsComparison): RegressionFinding[] {
  const regressions: RegressionFinding[] = [];

  const metrics: Array<{ name: string; comparison: MetricComparison }> = [
    { name: 'accuracy', comparison: metricsComparison.accuracy },
    { name: 'precision', comparison: metricsComparison.precision },
    { name: 'recall', comparison: metricsComparison.recall },
    { name: 'f1', comparison: metricsComparison.f1 },
    { name: 'latency', comparison: metricsComparison.latency },
  ];

  metrics.forEach(({ name, comparison }) => {
    if (comparison.isRegressed) {
      const severity = determineSeverity(name, comparison);
      regressions.push({
        metric: name,
        previousValue: comparison.previousValue,
        currentValue: comparison.currentValue,
        absoluteChange: comparison.absoluteChange,
        relativeChange: comparison.relativeChange,
        severity,
        description: generateRegressionDescription(name, comparison),
      });
    }
  });

  return regressions.sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[a.severity] - order[b.severity];
  });
}

function detectImprovements(metricsComparison: MetricsComparison): ImprovementFinding[] {
  const improvements: ImprovementFinding[] = [];

  const metrics: Array<{ name: string; comparison: MetricComparison }> = [
    { name: 'accuracy', comparison: metricsComparison.accuracy },
    { name: 'precision', comparison: metricsComparison.precision },
    { name: 'recall', comparison: metricsComparison.recall },
    { name: 'f1', comparison: metricsComparison.f1 },
  ];

  metrics.forEach(({ name, comparison }) => {
    if (comparison.relativeChange > 0.02) {
      improvements.push({
        metric: name,
        previousValue: comparison.previousValue,
        currentValue: comparison.currentValue,
        absoluteChange: comparison.absoluteChange,
        relativeChange: comparison.relativeChange,
        significance: comparison.relativeChange > 0.05 ? 'MAJOR' : 'MINOR',
        description: `${name} improved from ${(comparison.previousValue * 100).toFixed(2)}% to ${(comparison.currentValue * 100).toFixed(2)}%`,
      });
    }
  });

  return improvements;
}

function determineSeverity(
  metric: string,
  comparison: MetricComparison
): RegressionFinding['severity'] {
  const absChange = Math.abs(comparison.relativeChange);

  // Critical severity
  if (metric === 'accuracy' && comparison.relativeChange < -0.05) return 'CRITICAL';
  if (metric === 'f1' && comparison.relativeChange < -0.10) return 'CRITICAL';
  if (metric === 'latency' && comparison.relativeChange > 0.50) return 'CRITICAL';

  // High severity
  if (metric === 'accuracy' && comparison.relativeChange < -0.02) return 'HIGH';
  if (metric === 'f1' && comparison.relativeChange < -0.05) return 'HIGH';
  if (metric === 'precision' && comparison.relativeChange < -0.10) return 'HIGH';
  if (metric === 'recall' && comparison.relativeChange < -0.10) return 'HIGH';
  if (metric === 'latency' && comparison.relativeChange > 0.30) return 'HIGH';

  // Medium severity
  if (absChange > 0.02) return 'MEDIUM';

  // Low severity
  return 'LOW';
}

function generateRegressionDescription(
  metric: string,
  comparison: MetricComparison
): string {
  const direction = comparison.relativeChange < 0 ? 'decreased' : 'increased';
  const percentChange = Math.abs(comparison.relativeChange * 100).toFixed(2);

  if (metric === 'latency') {
    return `${metric} ${direction} by ${percentChange}% (${comparison.previousValue.toFixed(2)}ms -> ${comparison.currentValue.toFixed(2)}ms)`;
  }

  return `${metric} ${direction} by ${percentChange}% (${(comparison.previousValue * 100).toFixed(2)}% -> ${(comparison.currentValue * 100).toFixed(2)}%)`;
}

function hashDataset(testData: TestDataPoint[]): string {
  const str = JSON.stringify(testData.map((d) => d.id));
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Monitor model health continuously
 */
export async function runContinuousRegressionMonitoring(
  modelName: string,
  testData: TestDataPoint[],
  intervalMs: number = 300000,
  onRegression?: (regression: RegressionFinding) => void
): Promise<void> {
  console.log(`Starting continuous regression monitoring for ${modelName}`);

  while (true) {
    try {
      const result = await testForRegression(modelName, testData);

      if (result.regressions.length > 0) {
        console.warn(`[${result.timestamp}] Regressions detected:`);
        result.regressions.forEach((r) => {
          console.warn(`  - ${r.severity}: ${r.metric} (${(r.relativeChange * 100).toFixed(2)}%)`);
          onRegression?.(r);
        });
      } else {
        console.log(`[${result.timestamp}] No regressions detected`);
      }

      if (result.improvements.length > 0) {
        console.log(`Improvements detected:`);
        result.improvements.forEach((i) => {
          console.log(`  + ${i.metric}: +${(i.relativeChange * 100).toFixed(2)}%`);
        });
      }
    } catch (error) {
      console.error(`Error during monitoring: ${error}`);
    }

    await sleep(intervalMs);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Export utilities
export { REGRESSION_THRESHOLDS, baselines };
