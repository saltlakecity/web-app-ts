# Инструкция по настройке переменных окружения на сервере

## Важно! Переменные окружения для продакшена

После исправления Dockerfile (теперь использует встроенный Nuxt.js сервер), вам нужно убедиться, что на сервере правильно настроены переменные окружения.

### Проблема с текущей конфигурацией

В серверном `docker-compose.yml` для фронтенда **НЕ указаны** переменные окружения для подключения к backend:

```yaml
frontend:
  image: registry.gitlab.kosygin-rsu.ru/studsovet/studform-trpc-vue/frontend:master
  labels:
    com.centurylinklabs.watchtower.enable: true
    com.centurylinklabs.watchtower.scope: studsovet
  privileged: true
  ports:
    - "5201:3000"
  depends_on:
    - backend
  networks:
    - internal
  restart: unless-stopped
```

### Что нужно добавить

Nuxt.js использует переменные окружения для проксирования API запросов. Необходимо добавить следующие переменные:

```yaml
frontend:
  image: registry.gitlab.kosygin-rsu.ru/studsovet/studform-trpc-vue/frontend:master
  labels:
    com.centurylinklabs.watchtower.enable: true
    com.centurylinklabs.watchtower.scope: studsovet
  privileged: true
  environment:
    # URL бэкенда для проксирования API запросов
    # ВАЖНО: Используйте имя Docker сервиса, а не localhost!
    BACKEND_APP_URL: "http://backend:3000"
    
    # Публичный URL фронтенда (опционально)
    FRONTEND_APP_URL: "https://form.studsovet.kosygin-rsu.ru"
    
    # Путь к API (обычно не требуется менять)
    API_URL: "/api"
    
    # Настройки хоста и порта для Nuxt сервера
    HOST: "0.0.0.0"
    PORT: "3000"
    NODE_ENV: "production"
  ports:
    - "5201:3000"
  depends_on:
    - backend
  networks:
    - internal
  restart: unless-stopped
```

### Объяснение переменных

1. **BACKEND_APP_URL**: Указывает на backend контейнер внутри Docker сети
   - ✅ Используйте `http://backend:3000` - это внутреннее имя сервиса в Docker
   - ❌ Не используйте `localhost:5200` - это не сработает внутри контейнера!
   - ❌ Не используйте `http://backend:3000/api` - `/api` добавляется автоматически

2. **FRONTEND_APP_URL**: Публичный URL вашего фронтенда
   - Используется для конфигурации (например, для CORS на backend)
   - Укажите реальный домен, по которому доступен фронтенд
   - Замените `form.studsovet.kosygin-rsu.ru` на ваш реальный домен

3. **API_URL**: Путь к API
   - Обычно `/api`
   - Используется в tRPC клиенте

4. **HOST** и **PORT**: Настройки для Nuxt.js сервера
   - `HOST=0.0.0.0` - слушать на всех интерфейсах (обязательно для Docker!)
   - `PORT=3000` - порт внутри контейнера

## Как работает проксирование в Nuxt.js

Nuxt.js имеет встроенный веб-сервер **Nitro**, который автоматически проксирует API запросы благодаря конфигурации в `nuxt.config.ts`:

```typescript
nitro: {
  devProxy: {
    "/api": {
      target: process.env.BACKEND_APP_URL
        ? `${process.env.BACKEND_APP_URL}/api`
        : "http://localhost:3100/api",
      changeOrigin: true,
    },
  },
}
```

### Схема работы:

```
┌─────────────────────────────────────────────────────┐
│  Внешний мир (браузер пользователя)                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Nginx на сервере (порт 80/443)                     │
│  https://form.studsovet.kosygin-rsu.ru              │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Frontend контейнер (localhost:5201 → 3000)         │
│  Nuxt.js сервер (Nitro)                             │
│                                                      │
│  При запросе к /api/*:                              │
│    ↓ Проксирует к BACKEND_APP_URL                   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼ http://backend:3000/api/*
┌─────────────────────────────────────────────────────┐
│  Backend контейнер (localhost:5200 → 3000)          │
│  tRPC API сервер                                    │
└─────────────────────────────────────────────────────┘
```

### Преимущества такого подхода:

1. ✅ **Нет CORS проблем** - API запросы идут через тот же origin
2. ✅ **Простая конфигурация** - всё в одном месте (`nuxt.config.ts`)
3. ✅ **Работает одинаково** - и в development, и в production
4. ✅ **Не нужен дополнительный nginx** внутри контейнера

## Настройка внешнего Nginx (на сервере)

Если у вас есть nginx на сервере (вне Docker), вот пример конфигурации:

```nginx
server {
    listen 80;
    server_name form.studsovet.kosygin-rsu.ru;

    # Все запросы (включая /api/*) проксируются на Nuxt.js сервер
    location / {
        proxy_pass http://localhost:5201;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Важно:** Не нужно отдельно проксировать `/api/*` на backend! Nuxt.js сервер сам это сделает.

## Проверка конфигурации

### Шаг 1: Проверьте переменные окружения в контейнере

```bash
docker exec -it studsovet-frontend-1 env | grep -E "BACKEND|API|HOST|PORT"
```

Должно быть что-то вроде:
```
BACKEND_APP_URL=http://backend:3000
API_URL=/api
HOST=0.0.0.0
PORT=3000
NODE_ENV=production
```

### Шаг 2: Проверьте что Nuxt сервер запущен

```bash
docker logs -f studsovet-frontend-1
```

Должны увидеть что-то вроде:
```
Nitro built in XXX ms
Listening on http://0.0.0.0:3000
```

### Шаг 3: Проверьте доступность фронтенда

```bash
# На сервере
curl http://localhost:5201

# Должен вернуть HTML страницу
```

### Шаг 4: Проверьте проксирование API

```bash
# На сервере (изнутри frontend контейнера)
docker exec -it studsovet-frontend-1 sh
curl http://localhost:3000/api/trpc/healthCheck

# Или снаружи контейнера
curl http://localhost:5201/api/trpc/healthCheck
```

## Частые ошибки

### ❌ Ошибка 1: Использование localhost вместо имени сервиса

```yaml
# НЕПРАВИЛЬНО:
environment:
  BACKEND_APP_URL: "http://localhost:5200"

# ПРАВИЛЬНО:
environment:
  BACKEND_APP_URL: "http://backend:3000"
```

**Почему:** Внутри Docker контейнера `localhost` указывает на сам контейнер, а не на хост машину.

### ❌ Ошибка 2: Добавление /api к BACKEND_APP_URL

```yaml
# НЕПРАВИЛЬНО:
environment:
  BACKEND_APP_URL: "http://backend:3000/api"

# ПРАВИЛЬНО:
environment:
  BACKEND_APP_URL: "http://backend:3000"
```

**Почему:** В `nuxt.config.ts` уже добавляется `/api` к `BACKEND_APP_URL`.

### ❌ Ошибка 3: HOST не установлен в 0.0.0.0

```yaml
# НЕПРАВИЛЬНО (или отсутствует):
environment:
  HOST: "localhost"

# ПРАВИЛЬНО:
environment:
  HOST: "0.0.0.0"
```

**Почему:** В Docker контейнере нужно слушать на всех интерфейсах (`0.0.0.0`), иначе снаружи контейнера не будет доступа.

## Итоговый чек-лист

- [ ] Dockerfile использует Node.js вместо nginx
- [ ] В docker-compose.yml добавлена переменная `BACKEND_APP_URL=http://backend:3000`
- [ ] В docker-compose.yml добавлена переменная `HOST=0.0.0.0`
- [ ] В docker-compose.yml добавлена переменная `PORT=3000`
- [ ] Пересобраны и запущены Docker образы
- [ ] Проверены логи фронтенда (Nuxt сервер запущен)
- [ ] Проверена доступность фронтенда через браузер
- [ ] Проверена работа API запросов (проксирование работает)
- [ ] Настроен внешний nginx на сервере (если нужен)
