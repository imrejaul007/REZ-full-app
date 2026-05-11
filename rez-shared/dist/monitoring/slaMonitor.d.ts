interface SLAConfig {
    name: string;
    targetLatency: number;
    targetAvailability: number;
    windowMs: number;
}
interface SLAMetrics {
    name: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    latencyP50: number;
    latencyP95: number;
    latencyP99: number;
    availability: number;
    compliance: boolean;
}
declare class SLAMonitor {
    private configs;
    private metrics;
    register(config: SLAConfig): void;
    record(name: string, latency: number, success: boolean): void;
    getMetrics(name: string): SLAMetrics | null;
    private checkCompliance;
}
export declare const slaMonitor: SLAMonitor;
export {};
