import BetterSqlite3 from 'better-sqlite3';
export declare class Database {
    private db;
    constructor(dbPath?: string);
    private initialize;
    prepare(sql: string): BetterSqlite3.Statement;
    run(sql: string, params?: any[]): BetterSqlite3.RunResult;
    get<T>(sql: string, ...params: any[]): T | undefined;
    all<T>(sql: string, ...params: any[]): T[];
    transaction<T>(fn: () => T): T;
    close(): void;
    backup(destination: string): void;
}
export type DB = Database;
//# sourceMappingURL=database.d.ts.map