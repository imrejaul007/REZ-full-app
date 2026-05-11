export declare class Logger {
    private logDir;
    private errorLogPath;
    private accessLogPath;
    private combinedLogPath;
    constructor(logDir?: string);
    private formatMessage;
    private writeToFile;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
    logRequest(req: any, res: any, duration: number): void;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map