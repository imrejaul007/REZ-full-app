import Redis from 'ioredis';
export declare class DistributedLock {
    private redis;
    private locks;
    constructor(redis?: Redis);
    acquire(key: string, ttlMs?: number): Promise<() => Promise<void>>;
    withLock<T>(key: string, fn: () => Promise<T>, ttlMs?: number): Promise<T>;
    isLocked(key: string): Promise<boolean>;
}
export declare const distributedLock: DistributedLock;
