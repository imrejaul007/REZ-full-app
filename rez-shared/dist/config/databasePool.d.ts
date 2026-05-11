interface PoolConfig {
    maxPoolSize?: number;
    minPoolSize?: number;
    socketTimeout?: number;
    serverSelectionTimeout?: number;
}
export declare class DatabasePool {
    private static instance;
    private isConnected;
    private constructor();
    static getInstance(): DatabasePool;
    connect(uri: string, config?: PoolConfig): Promise<void>;
    disconnect(): Promise<void>;
    getStats(): {
        state: string;
        isConnected: boolean;
    };
}
export declare const dbPool: DatabasePool;
export {};
