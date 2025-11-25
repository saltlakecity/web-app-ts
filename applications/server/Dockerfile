FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-lock.yaml ./applications/server/
COPY applications/server/package*.json ./applications/server/

WORKDIR /app/applications/server

RUN pnpm install

COPY applications/server/src ./src
COPY applications/server/tsconfig.json ./
COPY applications/server/shared ./shared

EXPOSE 3000
CMD ["npx", "tsx", "src/index.ts"]