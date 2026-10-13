# Dengar.in web (Next.js 15) — build from the MONOREPO ROOT:
#
#   docker build -f apps/web/Dockerfile -t dengarin-web .
#   docker run --rm -p 3000:3000 --env-file .env.local dengarin-web
#
# Workspace packages (packages/*, services/*) are plain TypeScript sources
# resolved through tsconfig paths, so the whole workspace is needed at build
# time. No `output: 'standalone'` is assumed in next.config.js; the runtime
# stage simply runs `next start` from the built workspace.

ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/
COPY packages/prompts/package.json packages/prompts/
COPY packages/types/package.json packages/types/
COPY services/auth/package.json services/auth/
COPY services/crisis-engine/package.json services/crisis-engine/
COPY services/orchestrator/package.json services/orchestrator/
COPY services/persistence/package.json services/persistence/
COPY services/validator/package.json services/validator/
RUN npm ci --no-audit --no-fund

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Secrets are read at REQUEST time (process.env in route handlers), never baked
# into the image. Leave REDIS_URL/DATABASE_URL unset here so the build uses the
# in-memory fallbacks.
RUN npm run build --workspace=apps/web

FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S dengarin && adduser -S dengarin -G dengarin
COPY --from=build --chown=dengarin:dengarin /app ./
USER dengarin
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["npm", "run", "start", "--workspace=apps/web"]
