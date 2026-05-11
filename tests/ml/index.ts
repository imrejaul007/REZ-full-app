/**
 * ML Testing Framework - Entry Point
 * Comprehensive testing suite for ML models
 */

export {
  type ModelTestResult,
  type TestDataPoint,
  type PredictionResult,
  type Metrics,
  type ThresholdConfig,
  testModel,
  testModels,
  runContinuousTests,
  loadTestDataset,
  registerTestDataset,
  predict,
  calculateMetrics,
  ModelInferenceError,
} from './model-testing';

export {
  type BiasMetric,
  type BiasReport,
  type SensitiveAttribute,
  detectBias,
  runContinuousBiasMonitoring,
  BIAS_THRESHOLDS,
  SENSITIVE_ATTRIBUTES,
} from './bias-detection';

export {
  type FairnessAuditConfig,
  type FairnessCriterion,
  type FairnessAuditResult,
  type RegulatoryFramework,
  runFairnessAudit,
  formatAuditReport,
} from './fairness-audit';

export {
  type RegressionTestResult,
  type RegressionFinding,
  type ImprovementFinding,
  type BaselineMetrics,
  type CanaryTest,
  testForRegression,
  runCIRegressionTests,
  createBaseline,
  getBaseline,
  registerBaseline,
  runContinuousRegressionMonitoring,
  REGRESSION_THRESHOLDS,
} from './regression';
