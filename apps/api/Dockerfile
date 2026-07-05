FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --workspace @agents-sample/api

FROM deps AS build
COPY apps/api apps/api
RUN npm run build -w @agents-sample/api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --omit=dev --workspace @agents-sample/api
COPY --from=build /app/apps/api/dist apps/api/dist
CMD ["npm", "run", "start", "-w", "@agents-sample/api"]
