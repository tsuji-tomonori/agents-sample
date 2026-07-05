FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm install --workspace @agents-sample/backend

FROM deps AS build
COPY apps/backend apps/backend
RUN npm run build -w @agents-sample/backend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm install --omit=dev --workspace @agents-sample/backend
COPY --from=build /app/apps/backend/dist apps/backend/dist
CMD ["npm", "run", "start", "-w", "@agents-sample/backend"]
