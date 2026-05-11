/**
 * ML Model Testing Suite
 * Comprehensive testing framework for ML model evaluation
 */

interface TestDataPoint {
  id: string;
  input: unknown;
  expected: unknown;
  metadata?: Record<string, unknown>;
}

interface PredictionResult {
  id: string;
  output: unknown;
  confidence?: number;
  latency: number;
}

interface Metrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  latency: number;
  confusionMatrix?: number[][];
  perClassMetrics?: Array<{
    class: string;
    precision: number;
    recall: number;
    f1: number;
    support: number;
  }>;
}

export interface ModelTestResult {
  model: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  latency: number;
  passed: boolean;
  details?: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    timestamp: string;
    thresholds: ThresholdConfig;
    perClassMetrics?: Metrics['perClassMetrics'];
    confusionMatrix?: number[][];
  };
}

interface ThresholdConfig {
  minAccuracy: number;
  maxLatency: number;
  minPrecision?: number;
  minRecall?: number;
  minF1?: number;
}

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  minAccuracy: 0.85,
  maxLatency: 100, // ms
  minPrecision: 0.80,
  minRecall: 0.80,
  minF1: 0.80,
};

// Test dataset storage (in production, load from file/database)
const testDatasets: Map<string, TestDataPoint[]> = new Map();

/**
 * Load test dataset for a specific model
 */
export async function loadTestDataset(modelName: string): Promise<TestDataPoint[]> {
  // In production, this would load from a file or database
  const dataset = testDatasets.get(modelName);

  if (!dataset) {
    // Return mock dataset for testing
    return generateMockDataset(modelName);
  }

  return dataset;
}

/**
 * Register a test dataset
 */
export function registerTestDataset(modelName: string, data: TestDataPoint[]): void {
  testDatasets.set(modelName, data);
}

/**
 * Run prediction on a single input
 */
export async function predict(
  modelName: string,
  input: unknown,
  options?: { timeout?: number }
): Promise<PredictionResult> {
  const startTime = performance.now();

  try {
    // In production, this would call the actual ML model
    // Simulating model inference
    const output = await simulateModelInference(modelName, input);
    const latency = performance.now() - startTime;

    return {
      id: crypto.randomUUID(),
      output,
      confidence: Math.random() * 0.3 + 0.7, // Mock confidence
      latency,
    };
  } catch (error) {
    const latency = performance.now() - startTime;
    throw new ModelInferenceError(
      `Failed to run inference for model ${modelName}`,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Calculate metrics from test data and predictions
 */
export function calculateMetrics(
  testData: TestDataPoint[],
  predictions: PredictionResult[]
): Metrics {
  if (testData.length === 0) {
    return {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1: 0,
      latency: 0,
    };
  }

  // Build confusion matrix
  const labels = extractUniqueLabels([...testData.map((d) => d.expected as string)]);
  const confusionMatrix = buildConfusionMatrix(testData, predictions, labels);
  const labelToIndex = new Map(labels.map((l, i) => [l, i]));

  // Calculate per-class metrics
  const perClassMetrics = labels.map((label) => {
    const idx = labelToIndex.get(label)!;
    const { tp, fp, fn } = extractConfusionValues(confusionMatrix, idx);

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * (precision * recall)) / (precision + recall) : 0;
    const support = testData.filter((d) => String(d.expected) === label).length;

    return { class: label, precision, recall, f1, support };
  });

  // Calculate overall metrics (macro-averaged)
  const totalLatency = predictions.reduce((sum, p) => sum + p.latency, 0);
  const avgLatency = totalLatency / predictions.length;

  const accuracy = calculateAccuracy(testData, predictions);
  const precision = mean(perClassMetrics.map((m) => m.precision));
  const recall = mean(perClassMetrics.map((m) => m.recall));
  const f1 = mean(perClassMetrics.map((m) => m.f1));

  return {
    accuracy,
    precision,
    recall,
    f1,
    latency: avgLatency,
    confusionMatrix,
    perClassMetrics,
  };
}

/**
 * Main test function for a single model
 */
export async function testModel(
  modelName: string,
  thresholds?: Partial<ThresholdConfig>
): Promise<ModelTestResult> {
  const config = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // 1. Load test dataset
  const testData = await loadTestDataset(modelName);

  if (testData.length === 0) {
    return createFailedResult(modelName, 'No test data available', config);
  }

  // 2. Run predictions
  const predictions = await runBatchPredictions(modelName, testData);

  // 3. Calculate metrics
  const metrics = calculateMetrics(testData, predictions);

  // 4. Check thresholds
  const passed = checkThresholds(metrics, config);
  const passedCount = countPassedPredictions(testData, predictions);

  return {
    model: modelName,
    version: 'v1',
    accuracy: metrics.accuracy,
    precision: metrics.precision,
    recall: metrics.recall,
    f1: metrics.f1,
    latency: metrics.latency,
    passed,
    details: {
      totalTests: testData.length,
      passedTests: passedCount,
      failedTests: testData.length - passedCount,
      timestamp: new Date().toISOString(),
      thresholds: config,
      perClassMetrics: metrics.perClassMetrics,
      confusionMatrix: metrics.confusionMatrix,
    },
  };
}

/**
 * Test multiple models in batch
 */
export async function testModels(
  modelNames: string[],
  thresholds?: Partial<ThresholdConfig>
): Promise<ModelTestResult[]> {
  return Promise.all(modelNames.map((name) => testModel(name, thresholds)));
}

/**
 * Continuous testing with monitoring
 */
export async function runContinuousTests(
  modelName: string,
  intervalMs: number = 60000,
  durationMs: number = 300000
): Promise<ModelTestResult[]> {
  const results: ModelTestResult[] = [];
  const endTime = Date.now() + durationMs;

  while (Date.now() < endTime) {
    const result = await testModel(modelName);
    results.push(result);

    if (result.details) {
      console.log(
        `[${result.details.timestamp}] ${modelName}: ` +
          `accuracy=${result.accuracy.toFixed(3)}, ` +
          `latency=${result.latency.toFixed(2)}ms, ` +
          `passed=${result.passed}`
      );
    }

    await sleep(intervalMs);
  }

  return results;
}

// ============== Helper Functions ==============

function generateMockDataset(modelName: string): TestDataPoint[] {
  // Generate synthetic test data
  const samples = 100;
  return Array.from({ length: samples }, (_, i) => ({
    id: `sample-${i}`,
    input: { features: Array(10).fill(0).map(() => Math.random()) },
    expected: i % 2 === 0 ? 'positive' : 'negative',
    metadata: { source: 'synthetic', model: modelName },
  }));
}

async function simulateModelInference(modelName: string, input: unknown): Promise<unknown> {
  // Simulate inference latency
  const latency = Math.random() * 50 + 10;
  await sleep(latency);

  // Simple mock: return based on input hash
  const inputStr = JSON.stringify(input);
  const hash = simpleHash(inputStr);
  return hash % 2 === 0 ? 'positive' : 'negative';
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

async function runBatchPredictions(
  modelName: string,
  testData: TestDataPoint[]
): Promise<PredictionResult[]> {
  return Promise.all(testData.map((d) => predict(modelName, d.input)));
}

function extractUniqueLabels(labels: string[]): string[] {
  return [...new Set(labels)];
}

function buildConfusionMatrix(
  testData: TestDataPoint[],
  predictions: PredictionResult[],
  labels: string[]
): number[][] {
  const n = labels.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  const labelToIndex = new Map(labels.map((l, i) => [l, i]));

  testData.forEach((data, i) => {
    const expectedLabel = String(data.expected);
    const predictedLabel = String(predictions[i].output);
    const expectedIdx = labelToIndex.get(expectedLabel);
    const predictedIdx = labelToIndex.get(predictedLabel);

    if (expectedIdx !== undefined && predictedIdx !== undefined) {
      matrix[expectedIdx][predictedIdx]++;
    }
  });

  return matrix;
}

function extractConfusionValues(
  matrix: number[][],
  classIdx: number
): { tp: number; fp: number; fn: number; tn: number } {
  const n = matrix.length;
  let tp = 0,
    fp = 0,
    fn = 0,
    tn = 0;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === classIdx && j === classIdx) {
        tp = matrix[i][j];
      } else if (i === classIdx && j !== classIdx) {
        fn += matrix[i][j];
      } else if (i !== classIdx && j === classIdx) {
        fp += matrix[i][j];
      } else {
        tn += matrix[i][j];
      }
    }
  }

  return { tp, fp, fn, tn };
}

function calculateAccuracy(testData: TestDataPoint[], predictions: PredictionResult[]): number {
  let correct = 0;
  testData.forEach((data, i) => {
    if (String(data.expected) === String(predictions[i].output)) {
      correct++;
    }
  });
  return correct / testData.length;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function checkThresholds(metrics: Metrics, config: ThresholdConfig): boolean {
  return (
    metrics.accuracy >= config.minAccuracy &&
    metrics.latency <= config.maxLatency &&
    (config.minPrecision === undefined || metrics.precision >= config.minPrecision) &&
    (config.minRecall === undefined || metrics.recall >= config.minRecall) &&
    (config.minF1 === undefined || metrics.f1 >= config.minF1)
  );
}

function countPassedPredictions(testData: TestDataPoint[], predictions: PredictionResult[]): number {
  return testData.filter(
    (data, i) => String(data.expected) === String(predictions[i].output)
  ).length;
}

function createFailedResult(
  modelName: string,
  reason: string,
  thresholds: ThresholdConfig
): ModelTestResult {
  return {
    model: modelName,
    version: 'v1',
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1: 0,
    latency: 0,
    passed: false,
    details: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      timestamp: new Date().toISOString(),
      thresholds,
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============== Custom Error ==============

export class ModelInferenceError extends Error {
  constructor(message: string, public readonly cause: Error) {
    super(message);
    this.name = 'ModelInferenceError';
  }
}

// ============== Export utilities ==============

export { type TestDataPoint, type PredictionResult, type ThresholdConfig };
