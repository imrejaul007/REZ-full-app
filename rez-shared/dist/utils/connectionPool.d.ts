import { AxiosInstance } from 'axios';
interface PoolConfig {
    maxSockets: number;
    maxFreeSockets: number;
    timeout: number;
    idleTimeout: number;
}
export declare class ConnectionPool {
    private pools;
    getClient(name: string, baseURL: string, config?: Partial<PoolConfig>): AxiosInstance;
    getRazorpayClient(): AxiosInstance;
    getTwilioClient(): AxiosInstance;
    getFCMClient(): AxiosInstance;
}
export declare const connectionPool: ConnectionPool;
export {};
