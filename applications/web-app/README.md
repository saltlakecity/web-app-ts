# Web App (Telegram Mini App)

Telegram Mini App на Nuxt 3 для работы с формами студенческого совета.

## 🚀 Технологии

- **Nuxt 3** - Vue фреймворк
- **Vue 3** - Composition API
- **TypeScript** - типизация
- **Pinia** - state management
- **tRPC Client** - type-safe API клиент
- **SCSS** - стили
- **vue-tg** - интеграция с Telegram WebApp

## 📁 Структура проекта

```
web-app/
├── app/
│   ├── components/         # Vue компоненты
│   │   ├── Form.vue       # Карточка формы
│   │   ├── FormsList.vue  # Список форм
│   │   ├── FormView.vue   # Просмотр и заполнение формы
│   │   └── UserBanner.vue # Баннер пользователя
│   ├── composables/       # Vue composables
│   │   ├── useApi.ts      # API клиент
│   │   └── useForms.ts    # Работа с формами
│   ├── layouts/           # Layout компоненты
│   │   └── default.vue    # Основной layout
│   ├── pages/             # Страницы
│   │   ├── index.vue      # Главная страница
│   │   └── forms/
│   │       └── [id].vue   # Страница формы
│   ├── plugins/           # Nuxt плагины
│   │   ├── auth-init.client.ts  # Инициализация авторизации
│   │   └── router.ts            # Настройка роутера
│   ├── stores/            # Pinia stores
│   │   └── auth.ts        # Хранилище авторизации
│   ├── utils/             # Утилиты
│   │   └── jwt.ts         # JWT утилиты
│   ├── lib/               # Библиотеки
│   │   └── trpc.ts        # tRPC клиент
│   ├── assets/            # Статические ресурсы
│   │   ├── css/           # CSS стили
│   │   └── styles/        # SCSS стили
│   │       ├── _variables.scss  # Переменные
│   │       └── _mixins.scss     # Миксины
│   ├── types/             # TypeScript типы
│   └── app.vue            # Корневой компонент
├── public/                # Публичные файлы
│   ├── favicon.ico
│   ├── robots.txt
│   └── Top.png
├── nuxt.config.ts         # Конфигурация Nuxt
├── tsconfig.json
└── package.json
```

## 🔧 Установка и запуск

### Требования

- Node.js >= 18
- pnpm

### Установка зависимостей

```bash
pnpm install
```

### Переменные окружения

Не требуются для режима разработки. API проксируется через Nuxt dev server на `/api`.

Для production настройте:

```env
NUXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

### Запуск

```bash
# Режим разработки
pnpm dev

# Сборка для production
pnpm build

# Preview production сборки
pnpm preview

# Production запуск (после build)
pnpm start
```

Приложение будет доступно на `http://localhost:3000`

## 🎨 Компоненты

### Form.vue

Карточка отдельной формы в списке.

**Props:**
```typescript
{
  form: {
    id: number
    title: string
    status?: 'active' | 'inprocess' | 'completed'
  }
}
```

**Events:**
```typescript
{
  select: () => void  // Клик по карточке
}
```

**Стили:**
- Адаптивный дизайн
- Разные цвета для статусов
- Hover эффекты

### FormsList.vue

Список всех доступных форм.

**Events:**
```typescript
{
  'form-selected': (formId: number) => void
}
```

**Состояния:**
- Loading - показывает загрузку
- Error - показывает ошибку
- Empty - когда нет форм
- List - список форм

### FormView.vue

Компонент для просмотра и заполнения формы.

**Props:**
```typescript
{
  formId: number
}
```

**Events:**
```typescript
{
  back: () => void  // Возврат к списку
}
```

**Функции:**
- Динамическая загрузка полей формы
- Валидация обязательных полей
- Отправка ответов
- Очистка формы после успешной отправки

### UserBanner.vue

Баннер с информацией о пользователе.

**Отображает:**
- Имя и фамилию
- Username (если есть)
- User ID

## 🔌 Composables

### useApi()

Обертка над tRPC клиентом.

```typescript
const api = useApi()

// Методы
await api.getForms()                           // Получить список форм
await api.getFormFields(formId)                // Получить поля формы
await api.postFormResponse(formId, answers)    // Отправить ответ
await api.getUserResponses()                   // Получить ответы пользователя
await api.authenticateTelegram(initData)       // Авторизация
```

### useForms()

Composable для работы с формами.

```typescript
const { forms, isLoading, error, fetchForms } = useForms()
```

**Возвращает:**
- `forms` - реактивный массив форм
- `isLoading` - состояние загрузки
- `error` - ошибка если есть
- `fetchForms` - функция для перезагрузки

### useFormFields(formId)

Composable для получения полей формы.

```typescript
const formIdRef = ref(123)
const { formFields, isLoading, error, fetchFormFields } = useFormFields(formIdRef)
```

### useFormSubmit()

Composable для отправки ответов на формы.

```typescript
const { submitFormResponse, isSubmitting, submitError } = useFormSubmit()

await submitFormResponse(formId, answers)
```

## 🗃️ State Management (Pinia)

### Auth Store

Управление авторизацией пользователя.

```typescript
const authStore = useAuthStore()

// Состояние
authStore.isAuthenticated  // Авторизован ли пользователь
authStore.user            // Данные пользователя
authStore.jwtToken        // JWT токен
authStore.isTokenValid    // Валиден ли токен
authStore.tokenExpiry     // Когда истекает токен

// Методы
await authStore.authenticate()      // Авторизация
authStore.logout()                  // Выход
await authStore.initialize()        // Инициализация при запуске
authStore.clearError()              // Очистить ошибку
```

## 🎨 Стили

### Переменные (_variables.scss)

```scss
// Цвета
$color-primary: #42b983
$color-error: #f44336
$color-success: #4caf50

// Отступы
$spacing-sm: 8px
$spacing-md: 12px
$spacing-base: 16px
$spacing-lg: 20px

// Радиусы
$border-radius-sm: 4px
$border-radius-md: 8px
$border-radius-lg: 16px

// Переходы
$transition-fast: 120ms
$transition-base: 200ms
```

### Миксины (_mixins.scss)

```scss
@mixin center-content { }
@mixin content-container($max-width) { }
@mixin truncate { }
@mixin button-base { }
@mixin card { }
@mixin message($color, $bg-color) { }
@mixin loading-state { }
@mixin button-transparent { }
@mixin responsive($breakpoint) { }
```

## 🔐 Авторизация

### Процесс авторизации

1. При загрузке приложения выполняется `auth-init.client.ts` плагин
2. Плагин вызывает `authStore.initialize()`
3. Store получает `initData` от Telegram WebApp через `vue-tg`
4. `initData` отправляется на сервер для валидации
5. Сервер возвращает JWT токен
6. Токен сохраняется в store и используется для всех запросов

### JWT токены

- **Срок жизни**: 10 минут
- **Формат**: Bearer token в заголовке Authorization
- **Обновление**: Автоматическое (через `refreshTokenIfNeeded`)

### Защита роутов

Layout `default.vue` проверяет авторизацию:

```vue
<div v-if="isAuthenticated" class="layout__content">
  <UserBanner />
  <NuxtPage />
</div>
```

## 📱 Telegram WebApp

### Интеграция

Используется библиотека `vue-tg` для работы с Telegram WebApp API:

```typescript
import { useMiniApp } from 'vue-tg'

const miniApp = useMiniApp()
const initData = miniApp.initData  // Данные от Telegram
```

### Скрипт загрузки

В `nuxt.config.ts` добавлен скрипт Telegram WebApp:

```typescript
app: {
  head: {
    script: [
      { src: 'https://telegram.org/js/telegram-web-app.js' }
    ]
  }
}
```

### Scroll Behavior

Настроен специальный `scrollBehavior` для игнорирования хэша `#tgWebAppData`:

```typescript
// plugins/router.ts
router.options.scrollBehavior = (to, from, savedPosition) => {
  if (to.hash && to.hash.startsWith('#tgWebAppData')) {
    return
  }
  // ...
}
```

## 🔧 Конфигурация

### nuxt.config.ts

```typescript
export default defineNuxtConfig({
  ssr: false,              // SPA режим
  devtools: { enabled: true },
  
  typescript: {
    strict: true           // Строгая типизация
  },
  
  nitro: {
    devProxy: {            // Проксирование API в dev режиме
      '/api': {
        target: 'http://localhost:3100/api',
        changeOrigin: true
      }
    }
  },
  
  modules: ['@pinia/nuxt']
})
```

### tsconfig.json

Настроена интеграция с server приложением через path aliases:

```json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "paths": {
      "@studsovet/server/shared": ["../server/shared"]
    }
  }
}
```

## 🐛 Отладка

### Логирование

```typescript
// Проверка initData
console.log('InitData:', miniApp.initData)

// Проверка токена
console.log('JWT Token:', authStore.jwtToken)
console.log('Token valid:', authStore.isTokenValid)

// Проверка пользователя
console.log('User:', authStore.user)
```

### Ошибки авторизации

Если возникают проблемы с авторизацией:

1. Проверьте что API сервер запущен
2. Проверьте что `BOT_TOKEN` на сервере совпадает с токеном бота
3. Откройте Mini App через бота (не в браузере)
4. Проверьте консоль браузера на ошибки

## 🚀 Production

### Сборка

```bash
pnpm build
```

Сборка создаст статические файлы в `.output/`

### Развертывание

#### Vercel / Netlify

Приложение готово для развертывания на Vercel или Netlify:

1. Подключите репозиторий
2. Укажите build command: `pnpm build`
3. Укажите output directory: `.output/public`
4. Установите переменные окружения

#### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
CMD ["pnpm", "start"]
```

### Переменные окружения

```env
NUXT_PUBLIC_API_URL=https://api.your-domain.com/api
NODE_ENV=production
```

## 📝 Разработка

### Добавление новой страницы

Создайте файл в `app/pages/`:

```vue
<!-- app/pages/about.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'default'
})
</script>

<template>
  <div>About page</div>
</template>
```

Страница будет доступна по URL `/about`

### Добавление нового компонента

Создайте файл в `app/components/`:

```vue
<!-- app/components/MyComponent.vue -->
<script setup lang="ts">
const props = defineProps<{
  title: string
}>()
</script>

<template>
  <div>{{ title }}</div>
</template>
```

Компонент будет автоматически зарегистрирован и доступен как `<MyComponent />`

### Использование SCSS миксинов

```vue
<style lang="scss" scoped>
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;

.my-component {
  @include content-container($max-width-content);
  
  &__button {
    @include button-base;
    background-color: $color-primary;
  }
}
</style>
```

## 🧪 Тестирование

```bash
# TODO: Добавить тесты
pnpm test
```

## 📄 Лицензия

[Укажите лицензию]
