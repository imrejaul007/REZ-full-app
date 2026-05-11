"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setHealthy = setHealthy;
exports.startHealthServer = startHealthServer;
const http_1 = __importDefault(require("http"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("./config/logger");
const redis_1 = require("./config/redis");
let isHealthy = true;
function setHealthy(healthy) {
    isHealthy = healthy;
}
// OBS-HC: /ready must verify we can actually serve requests — not just
// return a hardcoded 200. Render uses this for pod recycling decisions.
async function checkReady() {
    const checks = {};
    let ok = true;
    try {
        if (mongoose_1.default.connection.readyState !== 1)
            throw new Error('not connected');
        await mongoose_1.default.connection.db?.admin().ping();
        checks.mongodb = 'ok';
    }
    catch (err) {
        checks.mongodb = `error: ${err.message}`;
        ok = false;
    }
    try {
        await redis_1.bullmqRedis.ping();
        checks.redis = 'ok';
    }
    catch (err) {
        checks.redis = `error: ${err.message}`;
        ok = false;
    }
    return { ok, checks };
}
function startHealthServer(port = 3001) {
    const server = http_1.default.createServer(async (req, res) => {
        if (req.url === '/health' || req.url === '/healthz') {
            if (isHealthy) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
            }
            else {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'unhealthy' }));
            }
        }
        else if (req.url === '/ready') {
            const { ok, checks } = await checkReady();
            res.writeHead(ok ? 200 : 503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: ok ? 'ready' : 'degraded', checks, timestamp: new Date().toISOString() }));
        }
        else {
            res.writeHead(404);
            res.end();
        }
    });
    server.listen(port, () => {
        logger_1.logger.info(`[Health] Server listening on port ${port}`);
    });
    return server;
}
//# sourceMappingURL=health.js.map