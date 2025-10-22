FROM node:22-alpine

WORKDIR /app

# Копируем package.json и pnpm-lock.yaml
COPY package*.json ./

# Устанавливаем pnpm
RUN npm install -g pnpm

# Устанавливаем зависимости
RUN pnpm install

# Копируем исходный код
COPY . .

# Собираем приложение
RUN pnpm build

# Запускаем бота в polling режиме
CMD ["pnpm", "start"]
