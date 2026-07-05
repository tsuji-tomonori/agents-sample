FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY scripts scripts
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --workspace @agents-sample/web

FROM deps AS build
WORKDIR /app
ARG NUXT_PUBLIC_API_BASE=http://localhost:8787
ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE
COPY apps/web apps/web
RUN npm run build -w @agents-sample/web

FROM node:22-alpine AS runner
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY --from=build /app/apps/web/.output .output
CMD ["node", ".output/server/index.mjs"]
