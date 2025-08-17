FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm i

COPY src ./src
COPY tsconfig.json ./

RUN npm run build

EXPOSE 3000
CMD ["node", "dist/server.js"]