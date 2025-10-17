import { ref, computed, onMounted } from 'vue';
import { useMiniApp } from 'vue-tg';
import { trpcApiClient } from '../lib/trpc-api';
import type { TelegramUser, TelegramValidationResponse } from '@studsovet/api';

export function useTelegramAuth() {
  const miniApp = useMiniApp();
  const isValidated = ref(false);
  const user = ref<TelegramUser | null>(null);
  const validationError = ref<string | null>(null);
  const isLoading = ref(false);

  // Computed свойство для получения initData
  const initData = computed(() => {
    return miniApp.initData || '';
  });

  // Computed свойство для получения userid
  const userId = computed(() => {
    return user.value?.id || null;
  });

  // Функция валидации initData
  const validateInitData = async () => {
    if (!initData.value) {
      validationError.value = 'InitData не доступен';
      return false;
    }

    isLoading.value = true;
    validationError.value = null;

    try {
      const response: TelegramValidationResponse = await trpcApiClient.validateTelegramData(initData.value);
      
      if (response.success) {
        user.value = response.user;
        isValidated.value = true;
        console.log('✅ Telegram данные валидированы:', response.user);
        return true;
      } else {
        validationError.value = 'Валидация не удалась';
        return false;
      }
    } catch (error: any) {
      console.error('❌ Ошибка валидации Telegram данных:', error);
      validationError.value = error.response?.data?.message || error.message || 'Ошибка валидации';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Автоматическая валидация при монтировании компонента
  onMounted(async () => {
    if (initData.value) {
      await validateInitData();
    }
  });

  return {
    // Состояние
    isValidated,
    user,
    validationError,
    isLoading,
    
    // Computed
    initData,
    userId,
    
    // Методы
    validateInitData
  };
}
