import winston from 'winston';

const serviceName = process.env.SERVICE_NAME || 'microservice';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  ),
  defaultMeta: { service: serviceName },
  transports: [new winston.transports.Console()],
});

// Safely merge meta — when meta is a string, spreading it produces { '0':'r', '1':'e', ... }
// (JS string spread by character index). Wrap strings in { error: meta } instead.
function safeMeta(name: string, meta?: any): object {
  if (meta === undefined || meta === null) return { component: name };
  if (typeof meta === 'string') return { component: name, error: meta };
  if (typeof meta !== 'object') return { component: name, error: String(meta) };
  return { component: name, ...meta };
}

export const createServiceLogger = (name: string) => ({
  info: (message: string, meta?: any) => logger.info(message, safeMeta(name, meta)),
  warn: (message: string, meta?: any) => logger.warn(message, safeMeta(name, meta)),
  error: (message: string, meta?: any) => logger.error(message, safeMeta(name, meta)),
  debug: (message: string, meta?: any) => logger.debug(message, safeMeta(name, meta)),
});
