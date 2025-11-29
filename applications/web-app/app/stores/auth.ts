import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useMiniApp } from "vue-tg";
import { useApi } from "~/composables/useApi";
import type {
  TelegramUser,
  TelegramAuthResponse,
  JWTPayload,
} from "@studsovet/server/shared";
import {
  parseJwtPayload,
  isJwtValid,
  getJwtExpiry,
  getUserFromJwt,
} from "~/utils/jwt";

export const useAuthStore = defineStore("auth", () => {
  // Состояние
  const isAuthenticated = ref(false);
  const user = ref<TelegramUser | null>(null);
  const jwtToken = ref<string | null>(null);
  const jwtPayload = ref<JWTPayload | null>(null);
  const authError = ref<string | null>(null);
  const isLoading = ref(false);
  const isInitialized = ref(false);

  // Получаем Telegram Mini App и API
  const miniApp = useMiniApp();
  const api = useApi();

  // Computed свойства
  const initData = computed(() => miniApp.initData || "");
  const userId = computed(() => user.value?.id || null);

  const isTokenValid = computed(() => {
    return jwtToken.value ? isJwtValid(jwtToken.value) : false;
  });

  const tokenExpiry = computed(() => {
    return jwtToken.value ? getJwtExpiry(jwtToken.value) : null;
  });

  // Функция авторизации
  const authenticate = async (): Promise<boolean> => {
    if (!initData.value) {
      authError.value = "InitData не доступен";
      return false;
    }

    isLoading.value = true;
    authError.value = null;

    try {
      const response: TelegramAuthResponse = await api.authenticateTelegram(
        initData.value
      );

      if (response.success) {
        user.value = response.user;
        isAuthenticated.value = true;
        jwtToken.value = response.jwt.token;
        jwtPayload.value = parseJwtPayload(response.jwt.token);

        return true;
      } else {
        authError.value = "Авторизация не удалась";
        return false;
      }
    } catch (error: any) {
      authError.value =
        error.response?.data?.message || error.message || "Ошибка авторизации";
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Функция выхода
  const logout = () => {
    isAuthenticated.value = false;
    user.value = null;
    jwtToken.value = null;
    jwtPayload.value = null;
    authError.value = null;
  };

  // Проверка существующего токена
  const checkExistingToken = (): boolean => {
    const token = jwtToken.value;
    if (!token) return false;

    if (isTokenValid.value) {
      jwtPayload.value = parseJwtPayload(token);
      user.value = getUserFromJwt(token);
      isAuthenticated.value = true;
      return true;
    }

    logout();
    return false;
  };

  // Автоматическая инициализация авторизации
  const initialize = async (): Promise<void> => {
    if (isInitialized.value) return;

    isInitialized.value = true;

    // Сначала проверяем существующий токен
    if (checkExistingToken()) return;

    // Если нет валидного токена, но есть initData, пытаемся авторизоваться
    if (initData.value) {
      await authenticate();
    }
  };

  // Обновление токена при необходимости
  const refreshTokenIfNeeded = async (): Promise<boolean> => {
    if (!isTokenValid.value && initData.value) {
      return await authenticate();
    }
    return isAuthenticated.value;
  };

  // Проверка авторизации перед запросом
  const ensureAuthenticated = async (): Promise<boolean> => {
    if (isAuthenticated.value && isTokenValid.value) {
      return true;
    }

    // Пытаемся обновить токен
    return await refreshTokenIfNeeded();
  };

  // Очистка ошибок
  const clearError = () => {
    authError.value = null;
  };

  return {
    // Состояние
    isAuthenticated,
    user,
    jwtToken,
    jwtPayload,
    authError,
    isLoading,
    isInitialized,

    // Computed
    initData,
    userId,
    isTokenValid,
    tokenExpiry,

    // Методы
    authenticate,
    logout,
    checkExistingToken,
    initialize,
    refreshTokenIfNeeded,
    ensureAuthenticated,
    clearError,
  };
});
