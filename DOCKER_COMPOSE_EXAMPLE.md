# Пример конфигурации docker-compose.yml для сервера

Это пример того, как должны выглядеть сервисы `backend` и `frontend` в файле `docker-compose.yml` на сервере.

**Важно:** Не копируйте весь файл! Измените только секции `backend` и `frontend` в существующем файле.

```yaml
version: "3"

networks:
  internal:

services:
  # ... другие сервисы (directus, database, bot, timetable-parser) ...

  backend:
    image: registry.gitlab.kosygin-rsu.ru/studsovet/studform-trpc-vue/backend:master
    labels:
      com.centurylinklabs.watchtower.enable: true
      com.centurylinklabs.watchtower.scope: studsovet
    privileged: true
    environment:
      # База данных
      DB_USER: ${FORM_DB_USER}
      DB_PASSWORD: ${FORM_DB_PASSWORD}
      DB_HOST: ${FORM_DB_HOST}
      DB_PORT: ${FORM_DB_PORT}
      DB_NAME: ${FORM_DB_NAME}

      # Сервер
      PORT: 3000
      BOT_TOKEN: ${FORM_BOT_TOKEN}

      # CORS - URL фронтенда (ДОБАВЛЕНО!)
      FRONTEND_APP_URL: "https://webapp.studsovet.kosygin-rsu.ru"
    ports:
      - "5200:3000"
    networks:
      - internal
    restart: unless-stopped

  frontend:
    image: registry.gitlab.kosygin-rsu.ru/studsovet/studform-trpc-vue/frontend:master
    labels:
      com.centurylinklabs.watchtower.enable: true
      com.centurylinklabs.watchtower.scope: studsovet
    privileged: true
    environment:
      # URL бэкенда для проксирования API запросов (ДОБАВЛЕНО!)
      # ВАЖНО: Используйте публичный URL, т.к. backend на отдельном поддомене
      BACKEND_APP_URL: "https://api.webapp.studsovet.kosygin-rsu.ru"

      # Публичный URL фронтенда (ДОБАВЛЕНО!)
      FRONTEND_APP_URL: "https://webapp.studsovet.kosygin-rsu.ru"

      # Путь к API (ДОБАВЛЕНО!)
      API_URL: "/api"

      # Настройки Nuxt сервера (ДОБАВЛЕНО!)
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

## Что изменилось?

### Backend (1 новая строка):

- ✅ `FRONTEND_APP_URL: "https://webapp.studsovet.kosygin-rsu.ru"` - для CORS

### Frontend (полностью новая секция environment):

- ✅ `BACKEND_APP_URL` - URL backend API
- ✅ `FRONTEND_APP_URL` - публичный URL фронтенда
- ✅ `API_URL` - путь к API
- ✅ `HOST` - слушать на всех интерфейсах (обязательно для Docker!)
- ✅ `PORT` - порт внутри контейнера
- ✅ `NODE_ENV` - режим production

## Команды для применения

```bash
cd ~/projects/studsovet

# 1. Отредактируйте docker-compose.yml
nano docker-compose.yml
# или
vim docker-compose.yml

# 2. Примените изменения
docker compose down frontend backend
docker compose up -d frontend backend

# 3. Проверьте логи
docker compose logs -f frontend backend
```
