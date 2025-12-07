# 🚀 Быстрое руководство по деплою

## Что было сделано

### 1. Исправлен Dockerfile

- ✅ Убран nginx
- ✅ Теперь использует встроенный Nuxt.js сервер (Nitro)
- ✅ Слушает на порту 3000

### 2. Обновлен nuxt.config.ts

- ✅ Добавлен `routeRules` для проксирования в production
- ✅ Использует переменные окружения для гибкой настройки

### 3. CORS правильно настроен на backend

- ✅ Использует `FRONTEND_APP_URL` для разрешения запросов

## Что нужно сделать на сервере

### Шаг 1: Обновить docker-compose.yml на сервере

Отредактируйте файл `~/projects/studsovet/docker-compose.yml`:

#### Backend сервис - добавьте одну строку:

```yaml
backend:
  # ... остальное без изменений
  environment:
    DB_USER: ${FORM_DB_USER}
    DB_PASSWORD: ${FORM_DB_PASSWORD}
    DB_HOST: ${FORM_DB_HOST}
    DB_PORT: ${FORM_DB_PORT}
    DB_NAME: ${FORM_DB_NAME}
    PORT: 3000
    BOT_TOKEN: ${FORM_BOT_TOKEN}
    FRONTEND_APP_URL: "https://webapp.studsovet.kosygin-rsu.ru" # ← ДОБАВЬТЕ ЭТУ СТРОКУ
```

#### Frontend сервис - замените весь блок:

```yaml
frontend:
  image: registry.gitlab.kosygin-rsu.ru/studsovet/studform-trpc-vue/frontend:master
  labels:
    com.centurylinklabs.watchtower.enable: true
    com.centurylinklabs.watchtower.scope: studsovet
  privileged: true
  environment:
    # URL бэкенда для проксирования
    BACKEND_APP_URL: "https://api.webapp.studsovet.kosygin-rsu.ru"
    # Публичный URL фронтенда
    FRONTEND_APP_URL: "https://webapp.studsovet.kosygin-rsu.ru"
    # Путь к API
    API_URL: "/api"
    # Настройки Nuxt сервера
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

### Шаг 2: Закоммитить и запушить изменения

На локальной машине:

```bash
git add .
git commit -m "fix: use Nuxt built-in server instead of nginx"
git push origin master  # или ваша ветка
```

### Шаг 3: Дождаться сборки новых образов

Проверьте GitLab CI/CD pipeline - убедитесь что новые образы собрались успешно.

### Шаг 4: Обновить и перезапустить на сервере

На сервере выполните:

```bash
cd ~/projects/studsovet

# Остановить контейнеры
docker compose down frontend backend

# Получить новые образы
docker pull registry.gitlab.kosygin-rsu.ru/studsovet/studform-trpc-vue/frontend:master
docker pull registry.gitlab.kosygin-rsu.ru/studsovet/studform-trpc-vue/backend:master

# Запустить
docker compose up -d frontend backend

# Посмотреть логи
docker compose logs -f frontend backend
```

### Шаг 5: Проверить что всё работает

```bash
# Проверить статус контейнеров
docker ps | grep -E "frontend|backend"

# Должны увидеть оба контейнера в статусе "Up"
```

Откройте в браузере: `https://webapp.studsovet.kosygin-rsu.ru`

## Ожидаемые логи

### Frontend (должен показать):

```
Nitro built in XXX ms
Listening on http://0.0.0.0:3000
```

### Backend (должен показать):

```
✅ PostgreSQL: connected
🚀 tRPC API server запущен на порту 3000
📡 tRPC endpoint: http://localhost:3000/api/trpc
```

## Если что-то не работает

### Frontend контейнер останавливается

```bash
# Смотрим логи
docker logs studsovet-frontend-1

# Проверяем переменные окружения
docker exec -it studsovet-frontend-1 env | grep -E "HOST|PORT|BACKEND"
```

**Решение:** Убедитесь что `HOST=0.0.0.0` установлен в docker-compose.yml

### CORS ошибки в браузере

Откройте DevTools → Console, если видите ошибку CORS:

```bash
# Проверьте FRONTEND_APP_URL на backend
docker exec -it studsovet-backend-1 env | grep FRONTEND

# Должно быть:
# FRONTEND_APP_URL=https://webapp.studsovet.kosygin-rsu.ru
```

**Решение:** Добавьте/исправьте `FRONTEND_APP_URL` в backend сервисе

### API запросы возвращают 404

```bash
# Проверьте что backend запущен
docker logs studsovet-backend-1

# Проверьте что порт открыт
docker exec -it studsovet-backend-1 netstat -tulpn | grep 3000
```

**Решение:** Перезапустите backend контейнер

## Структура файлов изменений

Измененные файлы в репозитории:

- ✅ `applications/web-app/Dockerfile` - использует Node.js вместо nginx
- ✅ `applications/web-app/nuxt.config.ts` - добавлены routeRules
- 📄 `SERVER_DEPLOYMENT_CONFIG.md` - подробная документация (этот файл)
- 📄 `ENVIRONMENT_SETUP.md` - настройка переменных окружения
- 📄 `QUICK_DEPLOY_GUIDE.md` - быстрое руководство (этот файл)

Файлы на сервере (нужно изменить вручную):

- ⚠️ `~/projects/studsovet/docker-compose.yml` - добавить переменные окружения

## Контакты для проверки

После деплоя проверьте:

- ✅ Frontend: https://webapp.studsovet.kosygin-rsu.ru
- ✅ Backend API: https://api.webapp.studsovet.kosygin-rsu.ru/api/health
- ✅ tRPC endpoint: https://api.webapp.studsovet.kosygin-rsu.ru/api/trpc

Все должно работать! 🎉
