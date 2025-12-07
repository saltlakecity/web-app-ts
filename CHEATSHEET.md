# 📋 Краткая памятка для деплоя

## 🎯 Что нужно сделать на сервере

### 1️⃣ Изменить docker-compose.yml

Файл: `~/projects/studsovet/docker-compose.yml`

#### Backend - добавить 1 строку:

```yaml
backend:
  environment:
    # ... существующие переменные ...
    FRONTEND_APP_URL: "https://webapp.studsovet.kosygin-rsu.ru" # ← ДОБАВИТЬ
```

#### Frontend - заменить весь блок `environment`:

```yaml
frontend:
  environment:
    BACKEND_APP_URL: "https://api.webapp.studsovet.kosygin-rsu.ru"
    FRONTEND_APP_URL: "https://webapp.studsovet.kosygin-rsu.ru"
    API_URL: "/api"
    HOST: "0.0.0.0"
    PORT: "3000"
    NODE_ENV: "production"
```

### 2️⃣ Команды для деплоя

```bash
cd ~/projects/studsovet

# Остановить
docker compose down frontend backend

# Обновить образы
docker pull registry.gitlab.kosygin-rsu.ru/studsovet/studform-trpc-vue/frontend:master
docker pull registry.gitlab.kosygin-rsu.ru/studsovet/studform-trpc-vue/backend:master

# Запустить
docker compose up -d frontend backend

# Проверить
docker compose logs -f frontend backend
```

### 3️⃣ Что должно быть в логах

✅ **Frontend:**

```
Nitro built in XXX ms
Listening on http://0.0.0.0:3000
```

✅ **Backend:**

```
✅ PostgreSQL: connected
🚀 tRPC API server запущен на порту 3000
```

## 🔍 Проверка

```bash
# Статус контейнеров
docker ps | grep -E "frontend|backend"

# Переменные окружения
docker exec -it studsovet-frontend-1 env | grep BACKEND
docker exec -it studsovet-backend-1 env | grep FRONTEND

# Доступность
curl https://webapp.studsovet.kosygin-rsu.ru
curl https://api.webapp.studsovet.kosygin-rsu.ru/api/health
```

## ❌ Если не работает

```bash
# Логи
docker compose logs -f frontend backend

# Перезапуск
docker compose restart frontend backend

# Полная перезагрузка
docker compose down frontend backend
docker compose up -d frontend backend
```

## 📞 Домены

- Frontend: https://webapp.studsovet.kosygin-rsu.ru
- Backend: https://api.webapp.studsovet.kosygin-rsu.ru

## 📚 Подробная документация

См. файлы:

- QUICK_DEPLOY_GUIDE.md
- DOCKER_COMPOSE_EXAMPLE.md
- SERVER_DEPLOYMENT_CONFIG.md
