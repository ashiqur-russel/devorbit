FROM node:20-alpine AS base
RUN corepack enable pnpm

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
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deployer /prod ./
EXPOSE 4000
CMD ["node", "dist/main"]
