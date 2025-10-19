import { useAuthStore } from "~/stores/auth";

export default defineNuxtPlugin(async () => {
  // Инициализируем авторизацию только на клиенте
  if (!import.meta.client) return;

  const authStore = useAuthStore();

  // Автоматически инициализируем авторизацию при запуске приложения
  await authStore.initialize();
});
