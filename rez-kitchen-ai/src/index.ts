/**
 * Kitchen AI - Main Entry Point
 *
 * Exports the KitchenAI class, types, and server utilities.
 */

export {
  KitchenAI,
  createKitchenAI,
  Order,
  OrderItem,
  FireItem,
  KitchenState,
  Station,
  ActiveOrder,
  ActiveItem,
  Bottleneck,
  DelayRecord,
  CookItem,
  PrepTimePrediction,
  PredictionFactor,
  StationBreakdown,
  HistoricalDataPoint,
  AlertConfig,
  EscalationLevel,
  PerformanceMetrics,
  StationMetric,
  StationType
} from './kitchenAI';

// Re-export server components when imported directly
export { app, kitchenAI } from './server';
