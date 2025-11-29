// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: false,

  // Настройки для работы с TypeScript
  typescript: {
    strict: true,
  },

  app: {
    head: {
      script: [{ src: "https://telegram.org/js/telegram-web-app.js" }],
      link: [
        {
          href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Onest:wght@100..900&display=swap",
          rel: "stylesheet",
        },
        {
          rel: "preload",
          href: "/fonts/Gothic60-Regular.otf",
          as: "font",
          type: "font/otf",
          crossorigin: "anonymous",
        },
      ],
    },
  },

  nitro: {
    devProxy: {
      "/api": {
        target: process.env.BACKEND_APP_URL
          ? `${process.env.BACKEND_APP_URL}/api`
          : "http://localhost:3100/api",
        changeOrigin: true,
      },
    },
  },

  // Настройки CSS
  css: ["~/assets/css/main.css"],

  // Настройки для работы с внешними API
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL || "/api",
      frontendAppUrl: process.env.FRONTEND_APP_URL || "http://localhost:3000",
    },
  },

  // Настройки для работы с модулями
  modules: ["@pinia/nuxt"],
});
