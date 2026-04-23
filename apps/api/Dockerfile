FROM node:20-alpine AS base
# Prefer IPv4 (avoids broken IPv6 routes in some Docker/OVH setups).
ENV NODE_OPTIONS=--dns-result-order=ipv4first
# Avoid Corepack fetching pnpm during build (often fails behind strict Docker DNS).
RUN npm install -g pnpm@9.15.4

FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @devorbit/api build

FROM builder AS deployer
RUN pnpm --filter @devorbit/api deploy --prod /prod && \
    cp -r /app/apps/api/dist /prod/dist

FROM node:20-alpine AS runner
# TLS to GitHub (OAuth token exchange) + system CA bundle for Alpine
RUN apk add --no-cache ca-certificates curl
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS=--dns-result-order=ipv4first
COPY --from=deployer /prod ./
EXPOSE 4000
CMD ["node", "dist/main"]
