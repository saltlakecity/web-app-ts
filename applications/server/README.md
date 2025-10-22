# API Server

Express сервер с tRPC API для работы с формами студенческого совета и авторизацией через Telegram.

## 🚀 Технологии

- **Express 5** - веб-фреймворк
- **tRPC 11** - type-safe API
- **PostgreSQL** - база данных
- **JWT** - авторизация
- **Zod** - валидация схем
- **TypeScript** - типизация

## 📁 Структура проекта

```
server/
├── src/
│   ├── handlers/           # tRPC обработчики
│   │   ├── forms.ts       # Работа с формами
│   │   └── telegram.ts    # Telegram авторизация
│   ├── middleware/        # Middleware
│   │   └── auth.ts        # JWT авторизация middleware
│   ├── utils/             # Утилиты
│   │   └── env.ts         # Проверка env переменных
│   ├── db.ts              # Подключение к БД
│   ├── jwt.ts             # JWT утилиты
│   ├── telegram.ts        # Валидация Telegram данных
│   ├── router.ts          # Главный tRPC роутер
│   └── index.ts           # Точка входа
├── shared/                # Shared типы и схемы
│   ├── schemas.ts         # Zod схемы
│   ├── router.ts          # Экспорт типа AppRouter
│   └── index.ts           # Экспорт всего shared
├── migrations/            # SQL миграции
│   ├── 0_initial_schema.sql
│   ├── 1_form_fields.sql
│   └── 2_responses.sql
├── dist/                  # Скомпилированные файлы
├── package.json
├── tsconfig.json
└── Dockerfile
```

## 🔧 Установка и запуск

### Требования

- Node.js >= 18
- PostgreSQL >= 14
- pnpm

### Установка зависимостей

```bash
pnpm install
```

### Настройка переменных окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Заполните переменные:

```env
# База данных
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=studsovet

# API сервер
PORT=3100

# JWT
JWT_SECRET=your-very-secure-secret-key-change-this

# Telegram Bot
BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

### Запуск

```bash
# Режим разработки (с hot reload)
pnpm dev

# Сборка
pnpm build

# Production запуск
pnpm start
```

Сервер будет доступен на `http://localhost:3100`

## 📡 API Endpoints

### Health Check

```
GET /api/health
```

Возвращает статус сервера.

### tRPC Endpoint

```
POST /api/trpc
```

Все tRPC запросы идут через этот endpoint.

## 🔐 Авторизация

### JWT токены

Авторизация происходит через JWT токены:

1. Пользователь открывает Telegram Mini App
2. Клиент отправляет `initData` от Telegram на `/api/trpc/telegram.authenticateTelegram`
3. Сервер валидирует `initData` и возвращает JWT токен
4. Клиент использует токен в заголовке `Authorization: Bearer <token>`
5. Middleware `authMiddleware` проверяет токен и добавляет данные пользователя в контекст

### Время жизни токена

- **JWT токен**: 10 минут
- **Telegram initData**: 24 часа

## 🔒 Безопасность

### Валидация Telegram данных

Сервер проверяет подпись `initData` используя алгоритм HMAC-SHA256:

1. Извлекается `hash` из параметров
2. Создается строка проверки из остальных параметров
3. Вычисляется HMAC с использованием секретного ключа
4. Сравнивается с переданным `hash`
5. Проверяется срок действия данных (не старше 24 часов)

### Защита от SQL Injection

Все запросы к БД используют параметризованные запросы через `pg`:

```typescript
// ✅ Правильно
pool.query("SELECT * FROM forms WHERE id = $1", [formId])

// ❌ Неправильно (не используется в проекте)
pool.query(`SELECT * FROM forms WHERE id = ${formId}`)
```

### Переменные окружения

Критичные переменные (`JWT_SECRET`, `BOT_TOKEN`) проверяются при запуске через утилиты:

```typescript
import { getJwtSecret, getBotToken } from './utils/env'

// Выбросит ошибку если переменная не установлена
const secret = getJwtSecret()
const token = getBotToken()
```

## 🧩 Shared типы

Типы и схемы вынесены в `shared/` для переиспользования:

```typescript
// В server приложении
import { FormMetaSchema, TelegramUser } from '../../shared/schemas'

// В web-app приложении
import type { FormMeta, TelegramUser } from '@studsovet/server/shared'
```

Это обеспечивает type-safety между фронтендом и бэкендом.

## 🐳 Docker

```bash
# Сборка образа
docker build -t studsovet-server .

# Запуск контейнера
docker run -p 3100:3100 --env-file .env studsovet-server
```

## 📝 Разработка

### Добавление нового роутера

1. Создайте файл в `src/handlers/`
2. Определите роутер с использованием `router` из `middleware/auth.ts`
3. Добавьте роутер в `src/router.ts`

Пример:

```typescript
// src/handlers/users.ts
import { router, protectedProcedure } from '../middleware/auth'
import { z } from 'zod'

export const usersRouter = router({
  getProfile: protectedProcedure
    .output(z.object({ id: z.number(), name: z.string() }))
    .query(async ({ ctx }) => {
      // ctx.user доступен благодаря authMiddleware
      return { id: ctx.user.userId, name: ctx.user.firstName }
    })
})

// src/router.ts
import { usersRouter } from './handlers/users'

export const appRouter = router({
  forms: formsRouter,
  telegram: telegramRouter,
  users: usersRouter, // добавляем новый роутер
})
```

### Добавление миграции

1. Создайте файл `migrations/N_description.sql`
2. Напишите SQL для миграции
3. Примените миграцию через `migrate`

## 🔍 Отладка

### Логирование

Ошибки tRPC логируются через `onError` callback:

```typescript
onError: ({ error, path, input }) => {
  console.error(`❌ tRPC Error on ${path}:`, error)
  console.error('Input:', input)
}
```

### Проверка подключения к БД

```typescript
pool.query('SELECT NOW()').then(res => {
  console.log('DB connection OK:', res.rows[0])
})
```

## 🚀 Production

### Оптимизация

- Используйте connection pooling (уже настроен через `pg.Pool`)
- Настройте CORS для production URL
- Используйте переменные окружения для всех секретов
- Включите rate limiting (TODO)
- Настройте мониторинг и логирование

### Переменные окружения для production

```env
NODE_ENV=production
PORT=3100
DB_HOST=your-db-host
JWT_SECRET=very-long-and-secure-secret
```

## 📄 Лицензия

[Укажите лицензию]

