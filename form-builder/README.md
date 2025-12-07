# Конструктор Форм

Простое приложение для создания и управления формами опросника через Directus API.

## Настройка

1. Скопируйте `env.example` в `.env`:
```bash
cp env.example .env
```

2. Укажите ваши данные в `.env`:
```env
DIRECTUS_URL=https://api.studsovet.kosygin-rsu.ru
DIRECTUS_TOKEN=your_token_here
```

## Запуск в Docker

```bash
cd form-builder
docker-compose up --build
```

Приложение будет доступно по адресу: **http://localhost:4000**

### Команды

```bash
# Запустить в фоновом режиме
docker-compose up -d --build

# Остановить
docker-compose down

# Посмотреть логи
docker-compose logs -f
```

## Запуск без Docker (локально)

```bash
cd form-builder
npm install

# Установите переменные окружения
export DIRECTUS_URL=https://api.studsovet.kosygin-rsu.ru
export DIRECTUS_TOKEN=your_token_here

npm start
```

## Функционал

- ✅ Создание, редактирование, удаление форм
- ✅ Создание, редактирование, удаление полей форм
- ✅ Поддержка различных типов полей:
  - text - текстовое поле
  - textarea - многострочный текст
  - email - поле для email
  - number - числовое поле
  - date - выбор даты
  - checkbox - чекбокс
  - choice - выбор из списка
  - select - выпадающий список
  - radio - радио кнопки
- ✅ Установка обязательности полей
- ✅ Описания для полей
- ✅ Варианты ответов для полей типа choice/select/radio

## API Endpoints

### Формы

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/forms` | Получить все формы |
| GET | `/api/forms/:id` | Получить форму с полями |
| POST | `/api/forms` | Создать форму |
| PUT | `/api/forms/:id` | Обновить форму |
| DELETE | `/api/forms/:id` | Удалить форму |

### Поля форм

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/forms/:formId/fields` | Получить поля формы |
| POST | `/api/forms/:formId/fields` | Добавить поле |
| PUT | `/api/fields/:id` | Обновить поле |
| DELETE | `/api/fields/:id` | Удалить поле |
| POST | `/api/forms/:formId/fields/reorder` | Изменить порядок полей |

### Служебные

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/health` | Проверка статуса и конфигурации |

## Получение токена Directus

1. Войдите в админку Directus
2. Перейдите в Settings → Access Tokens
3. Создайте новый статический токен с правами на чтение/запись коллекций `forms` и `form_fields`

## Технологии

- **Backend**: Node.js, Express.js
- **API**: Directus REST API
- **Frontend**: Vanilla JS, CSS
- **Containerization**: Docker
