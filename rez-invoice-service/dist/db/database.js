"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class Database {
    db;
    constructor(dbPath) {
        const resolvedPath = dbPath || process.env.DB_PATH || './data/invoices.db';
        const absolutePath = path.isAbsolute(resolvedPath)
            ? resolvedPath
            : path.join(process.cwd(), resolvedPath);
        const dir = path.dirname(absolutePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        this.db = new better_sqlite3_1.default(absolutePath);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        this.initialize();
    }
    initialize() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL DEFAULT 'tax_invoice',
        status TEXT NOT NULL DEFAULT 'draft',
        invoice_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
      CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
      CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
      CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(json_extract(data, '$.customerName'));
    `);
    }
    prepare(sql) {
        return this.db.prepare(sql);
    }
    run(sql, params) {
        return this.db.prepare(sql).run(...(params || []));
    }
    get(sql, ...params) {
        return this.db.prepare(sql).get(...params);
    }
    all(sql, ...params) {
        return this.db.prepare(sql).all(...params);
    }
    transaction(fn) {
        return this.db.transaction(fn)();
    }
    close() {
        this.db.close();
    }
    backup(destination) {
        this.db.backup(destination);
    }
}
exports.Database = Database;
//# sourceMappingURL=database.js.map