# =============================================================================
# REZ Refund Service - Production Dockerfile
# =============================================================================

FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache python3 make g++ curl && rm -rf /var/cache/apk/*
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

RUN apk add --no-cache dumb-init curl ca-certificates && rm -rf /var/cache/apk/*

RUN mkdir -p /app && chown -R nestjs:nodejs /app

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

ENV NODE_ENV=production
ENV PORT=3011
ENV TZ=UTC

USER nestjs

EXPOSE 3011

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3011/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
