// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  
  // Настройки для работы с TypeScript
  typescript: {
    strict: true
  },

  app: {
    head: {
      script: [{ src: 'https://telegram.org/js/telegram-web-app.js' }],
    },
  },

  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:3100/api',
        changeOrigin: true,
      },
    },
  },
  
  // Настройки CSS
  css: ['~/assets/css/main.css'],
  
  // Настройки для работы с внешними API
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || '/api'
    }
  },
  
  // Настройки для работы с модулями
  modules: [
    '@pinia/nuxt',
  ]
})
