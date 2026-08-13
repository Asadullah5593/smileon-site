# syntax=docker/dockerfile:1

# --- deps ------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# `postinstall` runs `prisma generate`, which needs the schema above.
RUN npm ci --ignore-scripts && npx prisma generate

# --- build -----------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholders: the real values are injected at runtime.
ENV DATABASE_URL="mysql://build:build@localhost:3306/build"
ENV AUTH_SECRET="build-time-placeholder-secret"
RUN npx prisma generate && npx next build

# --- runtime ---------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Migrations are applied by the entrypoint on start.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Local uploads live on a volume so they survive redeploys.
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads
VOLUME ["/app/public/uploads"]

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

# Liveness, not readiness: a failing probe here restarts the container, and a
# brief database blip must not do that. `/api/health/ready` is what a load
# balancer should poll.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
