interface ShutdownOptions {
    timeout: number;
    onShutdown: () => Promise<void>;
}
declare class GracefulShutdown {
    private handlers;
    private isShuttingDown;
    register(name: string, options: ShutdownOptions): void;
    start(): void;
    private shutdown;
}
export declare const gracefulShutdown: GracefulShutdown;
export {};
