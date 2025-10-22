# Студсовет Web App

Monorepo проект для студформ, включающий Telegram Mini App, API сервер и Telegram бота.

## 📦 Структура проекта

```
studsovet-web-app/
├── applications/
│   ├── server/              # API сервер (Express + tRPC)
│   ├── web-app/             # Telegram Mini App (Nuxt 3)
│   └── telegram-bot/        # Telegram бот (Grammy)
├── package.json             # Root package.json для workspace
├── pnpm-workspace.yaml      # Конфигурация pnpm workspace
└── docker-compose.yml       # Docker конфигурация
```

## 🚀 Быстрый старт

### Требования

- Node.js >= 18
- pnpm >= 9
- PostgreSQL >= 14
- Docker и Docker Compose (опционально)

### Установка

```bash
# Клонирование репозитория
git clone <repository-url>
cd studsovet-web-app

# Установка всех зависимостей
pnpm install

# Настройка переменных окружения
cp env.example .env
cp applications/server/.env.example applications/server/.env
cp applications/telegram-bot/.env.example applications/telegram-bot/.env
```

### Настройка базы данных

```bash
# Запуск PostgreSQL через Docker
docker-compose up -d postgres

# Или используйте свой экземпляр PostgreSQL
# и настройте подключение в applications/server/.env
```

### Запуск в режиме разработки

```bash
# Запуск API сервера
cd applications/server
pnpm dev

# В другом терминале - запуск веб-приложения
cd applications/web-app
pnpm dev

# В третьем терминале - запуск Telegram бота
cd applications/telegram-bot
pnpm dev
```

## 🏗️ Приложения

### API Сервер (`applications/server`)

Express сервер с tRPC API для работы с формами и авторизацией через Telegram.

**Технологии:**
- Express 5
- tRPC 11
- PostgreSQL (pg)
- JWT авторизация
- TypeScript
- Zod для валидации

**Основные возможности:**
- ✅ JWT авторизация через Telegram WebApp
- ✅ CRUD операции с формами
- ✅ Валидация данных через Telegram InitData
- ✅ Type-safe API через tRPC
- ✅ Shared типы между фронтендом и бэкендом

[Подробнее →](applications/server/README.md)

### Web App (`applications/web-app`)

Telegram Mini App на Nuxt 3 для заполнения форм.

**Технологии:**
- Nuxt 3
- Vue 3 Composition API
- TypeScript
- Pinia для state management
- tRPC клиент
- SCSS

**Основные возможности:**
- ✅ Авторизация через Telegram WebApp
- ✅ Список и заполнение форм
- ✅ Адаптивный дизайн
- ✅ SSR отключен (SPA режим)
- ✅ Интеграция с Telegram UI

[Подробнее →](applications/web-app/README.md)

### Telegram Bot (`applications/telegram-bot`)

Telegram бот для взаимодействия с пользователями и запуска Mini App.

**Технологии:**
- Grammy (Telegram Bot Framework)
- TypeScript
- Polling режим

**Основные возможности:**
- ✅ Команды `/start` и `/help`
- ✅ Кнопка для запуска Mini App
- ✅ Graceful shutdown
- ✅ Обработка ошибок

[Подробнее →](applications/telegram-bot/README.md)

## 🔧 Конфигурация

### Переменные окружения

#### Корневой `.env`
```env
# Общие настройки
NODE_ENV=development
```

#### `applications/server/.env`
```env
# База данных
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=studsovet

# API
PORT=3100

# JWT
JWT_SECRET=your-secret-key-here

# Telegram
BOT_TOKEN=your-telegram-bot-token
```

#### `applications/telegram-bot/.env`
```env
BOT_TOKEN=your-telegram-bot-token
MINI_APP_URL=https://your-app-url.com
```

## 🐳 Docker

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

## 📝 Скрипты

```bash
# Установка всех зависимостей
pnpm install

# Сборка всех приложений
pnpm build

# Линтинг (если настроен)
pnpm lint

# Форматирование (если настроено)
pnpm format
```

## 🗄️ База данных

### Схема

- `forms` - формы для заполнения
- `form_fields` - поля форм
- `responses` - ответы пользователей
- `response_fields` - значения полей в ответах

### Миграции

Миграции находятся в `applications/server/migrations/`:
- `0_initial_schema.sql` - начальная схема БД
- `1_form_fields.sql` - добавление позиций для полей
- `2_responses.sql` - добавление responder_id

## 🔐 Безопасность

- ✅ JWT токены с коротким сроком жизни (10 минут)
- ✅ Валидация Telegram InitData через HMAC
- ✅ Переменные окружения для секретов
- ✅ SQL параметризованные запросы (защита от SQL injection)
- ✅ CORS настроен
- ✅ Проверка обязательных env переменных

## 📚 Архитектурные решения

### Monorepo

Используется pnpm workspaces для управления монорепозиторием. Это позволяет:
- Переиспользовать код между приложениями
- Управлять зависимостями централизованно
- Иметь единую конфигурацию TypeScript

### Shared типы

Типы и схемы Zod вынесены в `applications/server/shared/` и используются:
- В API сервере для валидации
- В веб-приложении для type-safety
- В tRPC для автоматической типизации

### tRPC

Используется tRPC для type-safe API без кодогенерации:
- Автоматическая типизация на клиенте
- Валидация через Zod
- Удобная работа с ошибками

## 🧪 Тестирование

```bash
# TODO: Добавить тесты
pnpm test
```

## 📦 Сборка для production

```bash
# Сборка всех приложений
pnpm build

# Запуск в production режиме
cd applications/server && pnpm start
cd applications/web-app && pnpm start
cd applications/telegram-bot && pnpm start
```

