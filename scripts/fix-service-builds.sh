#!/bin/bash
# Fix common build issues across services

echo "=== FIXING BUILD ISSUES ==="

# Fix rez-payment-service logger import
echo "Fixing rez-payment-service..."
if [ -f "rez-payment-service/src/services/paymentPoller.ts" ]; then
  sed -i '' 's/from.*@rez\/shared.*logger.*/import { logger } from ".\/utils\/logger";/g' rez-payment-service/src/services/paymentPoller.ts
fi
if [ -f "rez-payment-service/src/utils/logger.ts" ]; then
  cat > rez-payment-service/src/utils/logger.ts << 'LOGGER'
import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat)
    })
  ]
});

export function createServiceLogger(serviceName: string) {
  return logger.child({ service: serviceName });
}
LOGGER
fi

# Fix rez-order-service shared-types import
echo "Fixing rez-order-service..."
if [ -f "rez-order-service/src/models/Order.ts" ]; then
  sed -i '' 's/@rez\/shared-types/@rez\/shared/g' rez-order-service/src/models/Order.ts 2>/dev/null || true
fi

echo ""
echo "=== BUILD FIXES APPLIED ==="
echo "Note: Some services may need manual fixes for complex type errors."
