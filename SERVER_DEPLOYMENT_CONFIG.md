# Правильная конфигурация для серверного docker-compose.yml

## Ваши домены

- **Frontend**: `https://webapp.studsovet.kosygin-rsu.ru`
- **Backend API**: `https://api.webapp.studsovet.kosygin-rsu.ru`

## Важное изменение в docker-compose.yml на сервере

### Backend сервис

Добавьте переменную окружения `FRONTEND_APP_URL` для настройки CORS:

```yaml
backend:
  image: registry.gitlab.kosygin-rsu.ru/studsovet/studform-trpc-vue/backend:master
  labels:
    com.centurylinklabs.watchtower.enable: true
    com.centurylinklabs.watchtower.scope: studsovet
  privileged: true
  environment:
    DB_USER: ${FORM_DB_USER}
    DB_PASSWORD: ${FORM_DB_PASSWORD}
    DB_HOST: ${FORM_DB_HOST}
    DB_PORT: ${FORM_DB_PORT}
    DB_NAME: ${FORM_DB_NAME}
    PORT: 3000
    BOT_TOKEN: ${FORM_BOT_TOKEN}
    # ВАЖНО: Добавьте эту строку для CORS
    FRONTEND_APP_URL: "https://webapp.studsovet.kosygin-rsu.ru"
  ports:
    - "5200:3000"
  networks:
    - internal
  restart: unless-stopped
```

### Frontend сервис

Добавьте переменные окружения:

```yaml
frontend:
  image: registry.gitlab.kosygin-rsu.ru/studsovet/studform-trpc-vue/frontend:master
  labels:
    com.centurylinklabs.watchtower.enable: true
    com.centurylinklabs.watchtower.scope: studsovet
  privileged: true
  environment:
    # URL бэкенда для проксирования API запросов
    # Используйте ПОЛНЫЙ публичный URL, т.к. backend на отдельном поддомене
    BACKEND_APP_URL: "https://api.webapp.studsovet.kosygin-rsu.ru"

    # Публичный URL фронтенда
    FRONTEND_APP_URL: "https://webapp.studsovet.kosygin-rsu.ru"

    # Путь к API (используется в tRPC клиенте)
    API_URL: "/api"

    # Настройки для Nuxt сервера
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

## Как это работает

### Схема взаимодействия:

```
┌──────────────────────────────────────────────────────┐
│  Пользователь (браузер/Telegram)                     │
└─────────────────┬────────────────────────────────────┘
                  │
    ┌─────────────┴──────────────┐
    │                            │
    ▼                            ▼
┌──────────────────────┐   ┌──────────────────────┐
│  Frontend            │   │  Backend API         │
│  webapp.studsovet... │   │  api.webapp.studso...│
│                      │   │                      │
│  Nginx (порт 80/443) │   │  Nginx (порт 80/443) │
│        ▼             │   │        ▼             │
│  localhost:5201      │   │  localhost:5200      │
│        ▼             │   │        ▼             │
│  Frontend container  │───│  Backend container   │
│  (Nuxt server)       │   │  (tRPC server)       │
│  порт 3000           │   │  порт 3000           │
└──────────────────────┘   └──────────────────────┘
```

### Детали:

1. **Браузер** открывает `https://webapp.studsovet.kosygin-rsu.ru`
2. **Внешний Nginx** (на хосте) проксирует на `localhost:5201`
3. **Frontend контейнер** (Nuxt server) получает запрос
4. Когда браузер делает запрос к `/api/*`:
   - **Если используется routeRules** (в production): Nuxt сервер проксирует на `https://api.webapp.studsovet.kosygin-rsu.ru/api/*`
   - **Если routeRules не работает**: Браузер делает прямой запрос на `https://api.webapp.studsovet.kosygin-rsu.ru/api/*`
5. **Внешний Nginx** (для API) проксирует на `localhost:5200`
6. **Backend контейнер** обрабатывает запрос и проверяет CORS

## Два варианта конфигурации

### Вариант 1: С проксированием через Nuxt (рекомендуется для dev, сложнее для prod)

Frontend использует `BACKEND_APP_URL` и проксирует запросы:

```yaml
environment:
  BACKEND_APP_URL: "https://api.webapp.studsovet.kosygin-rsu.ru"
  API_URL: "/api" # Относительный путь
```

В этом случае:

- ✅ Нет CORS проблем (запросы идут через тот же домен)
- ❌ Требуется настройка routeRules в Nuxt
- ❌ Дополнительный hop (фронтенд → бэкенд)

### Вариант 2: Прямые запросы к API (проще для prod)

Frontend делает запросы напрямую к API домену:

```yaml
environment:
  # Полный URL к API
  API_URL: "https://api.webapp.studsovet.kosygin-rsu.ru/api"
  FRONTEND_APP_URL: "https://webapp.studsovet.kosygin-rsu.ru"
```

В этом случае:

- ✅ Проще конфигурация
- ✅ Прямые запросы (быстрее)
- ⚠️ Требуется правильная настройка CORS на backend

**Рекомендуется Вариант 2** для вашего случая, т.к. backend уже на отдельном поддомене.

## Настройка CORS на Backend

Убедитесь, что в `applications/server/src/index.ts` правильно настроен CORS:

```typescript
const app = fastify({
  logger: true,
});

// Регистрируем CORS
app.register(cors, {
  origin: process.env.FRONTEND_APP_URL || "http://localhost:3000",
  credentials: true,
});
```

## Шаги по внедрению

### Шаг 1: Обновите docker-compose.yml на сервере

Добавьте переменные окружения как указано выше.

### Шаг 2: Пересоберите образы

```bash
cd ~/projects/studsovet

# Остановить контейнеры
docker compose down frontend backend

# Получить новые образы из registry
docker pull registry.gitlab.kosygin-rsu.ru/studsovet/studform-trpc-vue/frontend:master
docker pull registry.gitlab.kosygin-rsu.ru/studsovet/studform-trpc-vue/backend:master

# Запустить
docker compose up -d frontend backend
```

### Шаг 3: Проверьте логи

```bash
# Логи фронтенда
docker logs -f studsovet-frontend-1

# Логи бэкенда
docker logs -f studsovet-backend-1
```

Фронтенд должен показать:

```
Nitro built in XXX ms
Listening on http://0.0.0.0:3000
```

Бэкенд должен показать:

```
✅ PostgreSQL: connected
🚀 tRPC API server запущен на порту 3000
📡 tRPC endpoint: http://localhost:3000/api/trpc
```

### Шаг 4: Проверьте доступность

```bash
# Проверьте фронтенд
curl https://webapp.studsovet.kosygin-rsu.ru

# Проверьте backend API
curl https://api.webapp.studsovet.kosygin-rsu.ru/api/trpc
```

### Шаг 5: Проверьте в браузере

1. Откройте `https://webapp.studsovet.kosygin-rsu.ru` в браузере
2. Откройте DevTools → Network
3. Проверьте что запросы к API идут правильно
4. Если видите ошибки CORS, проверьте настройки `FRONTEND_APP_URL` на backend

## Настройка внешнего Nginx (на сервере, вне Docker)

### Для фронтенда (webapp.studsovet.kosygin-rsu.ru)

```nginx
server {
    listen 80;
    server_name webapp.studsovet.kosygin-rsu.ru;

    # Redirect to HTTPS (если используете SSL)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name webapp.studsovet.kosygin-rsu.ru;

    # SSL сертификаты
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Проксирование на frontend контейнер
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

### Для бэкенда (api.webapp.studsovet.kosygin-rsu.ru)

```nginx
server {
    listen 80;
    server_name api.webapp.studsovet.kosygin-rsu.ru;

    # Redirect to HTTPS (если используете SSL)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.webapp.studsovet.kosygin-rsu.ru;

    # SSL сертификаты
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Проксирование на backend контейнер
    location / {
        proxy_pass http://localhost:5200;
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

## Итоговый чек-лист

### Изменения в коде (уже сделано):

- [x] Dockerfile использует Node.js + Nuxt сервер вместо nginx
- [x] nuxt.config.ts имеет routeRules для проксирования в production
- [x] tRPC клиент использует runtimeConfig для API URL

### На сервере (нужно сделать):

- [ ] Обновить код на сервере (git pull)
- [ ] Добавить `FRONTEND_APP_URL` в backend сервис в docker-compose.yml
- [ ] Добавить переменные окружения в frontend сервис в docker-compose.yml:
  - [ ] `BACKEND_APP_URL=https://api.webapp.studsovet.kosygin-rsu.ru`
  - [ ] `FRONTEND_APP_URL=https://webapp.studsovet.kosygin-rsu.ru`
  - [ ] `API_URL=/api`
  - [ ] `HOST=0.0.0.0`
  - [ ] `PORT=3000`
- [ ] Пересобрать/получить новые Docker образы
- [ ] Запустить контейнеры
- [ ] Проверить логи
- [ ] Проверить доступность через браузер
- [ ] Проверить работу API запросов (в DevTools → Network)

## Частые проблемы и решения

### Проблема: CORS ошибка

**Симптом:** В DevTools видна ошибка типа "Access to fetch at ... has been blocked by CORS policy"

**Решение:**

1. Проверьте что `FRONTEND_APP_URL` в backend сервисе указан правильно
2. Убедитесь что значение совпадает с реальным доменом: `https://webapp.studsovet.kosygin-rsu.ru`
3. Перезапустите backend контейнер после изменения

### Проблема: API запросы возвращают 404

**Симптом:** Запросы к `/api/trpc/...` возвращают 404

**Решение:**

1. Проверьте что backend контейнер запущен: `docker ps | grep backend`
2. Проверьте логи backend: `docker logs studsovet-backend-1`
3. Проверьте что API URL правильный в переменных окружения frontend

### Проблема: Frontend контейнер останавливается

**Симптом:** Контейнер запускается и сразу останавливается

**Решение:**

1. Проверьте логи: `docker logs studsovet-frontend-1`
2. Убедитесь что образ собран с новым Dockerfile (с Node.js, а не nginx)
3. Проверьте что `HOST=0.0.0.0` установлен в переменных окружения
