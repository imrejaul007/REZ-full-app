type Semaphore = {
    acquire: () => Promise<() => void>;
    tryAcquire: () => boolean;
};
export declare function createSemaphore(maxConcurrent: number): Semaphore;
export declare class Bulkhead {
    private semaphores;
    getSemaphore(name: string, maxConcurrent: number): Semaphore;
    execute<T>(name: string, maxConcurrent: number, fn: () => Promise<T>): Promise<T>;
}
export {};
