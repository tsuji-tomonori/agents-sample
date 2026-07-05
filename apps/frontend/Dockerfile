FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY scripts scripts
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm install --workspace @agents-sample/frontend

FROM deps AS build
WORKDIR /app
ARG NUXT_PUBLIC_API_BASE=http://localhost:8787
ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE
COPY apps/frontend apps/frontend
RUN npm run build -w @agents-sample/frontend

FROM node:22-alpine AS runner
WORKDIR /app/apps/frontend
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY --from=build /app/apps/frontend/.output .output
CMD ["node", ".output/server/index.mjs"]
