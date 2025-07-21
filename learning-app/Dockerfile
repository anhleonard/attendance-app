# -------- Stage 1: Builder --------
FROM node:18-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm prisma generate
RUN pnpm run build

# -------- Stage 2: Production --------
FROM node:18-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

RUN apk add --no-cache dumb-init

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Ensure migrations are properly copied
RUN ls -la prisma/migrations/

RUN mkdir -p uploads && chown -R nestjs:nodejs uploads

USER nestjs

EXPOSE 3010

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3010/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
    