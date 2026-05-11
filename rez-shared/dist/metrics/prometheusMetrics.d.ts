import { Counter, Histogram, Gauge, Summary } from 'prom-client';
export declare const httpRequestsTotal: Counter<"status" | "method" | "route">;
export declare const httpRequestDuration: Histogram<"method" | "route">;
export declare const walletBalanceGauge: Gauge<"userId">;
export declare const orderCountTotal: Counter<"status" | "merchantId">;
export declare const paymentAmountTotal: Counter<"status" | "currency">;
export declare const activeConnectionsGauge: Gauge<string>;
export declare const cacheHitRate: Summary<string>;
export declare function metricsMiddleware(req: any, res: any, next: any): void;
