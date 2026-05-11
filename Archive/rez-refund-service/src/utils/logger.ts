import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format
 */
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

/**
 * Winston logger instance for the refund service
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/refund-service.log',
    level: 'info'
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/refund-service-error.log',
    level: 'error'
  }));
}

/**
 * Create a child logger with additional context
 */
export function createContextLogger(context: Record<string, unknown>): winston.Logger {
  return logger.child(context);
}
