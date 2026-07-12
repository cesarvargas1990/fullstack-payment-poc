FROM node:22.11.0-alpine AS deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci

FROM node:22.11.0-alpine AS build
WORKDIR /app/backend
COPY --from=deps /app/backend/node_modules ./node_modules
COPY backend ./
RUN npm run build

FROM node:22.11.0-alpine AS runner
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=deps /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY backend/package*.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
