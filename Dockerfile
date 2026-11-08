# Stage 1: Build application
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src



RUN npm run build

# stage 2 production environment

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev


COPY --from=builder /app/dist ./dist


EXPOSE 5000


USER node

CMD ["node", "dist/server.js"]



