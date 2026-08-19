FROM node:22-bookworm-slim AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_DEFAULT_USER_EMAIL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_DEFAULT_USER_EMAIL=$NEXT_PUBLIC_DEFAULT_USER_EMAIL
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/desktop/package.json apps/desktop/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build -w @mail-agent/shared && npm run build -w @mail-agent/web

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/web ./apps/web
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@mail-agent/web"]
