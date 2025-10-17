import { ref, computed } from 'vue';
import { trpcApiClient } from '../lib/trpc-api';
import type { FormMeta, FormField } from '@studsovet/server/shared';

export function useForms() {
  const forms = ref<FormMeta[]>([]);
  const formFields = ref<FormField[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed для получения форм
  const formsList = computed(() => forms.value);

  // Computed для получения полей формы
  const fieldsList = computed(() => formFields.value);

  // Загрузка всех форм
  const fetchForms = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      forms.value = await trpcApiClient.getForms();
      console.log('✅ Формы загружены:', forms.value);
    } catch (err: any) {
      console.error('❌ Ошибка загрузки форм:', err);
      error.value = err.message || 'Ошибка загрузки форм';
    } finally {
      isLoading.value = false;
    }
  };

  // Загрузка полей формы
  const fetchFormFields = async (formId: number) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      formFields.value = await trpcApiClient.getFormFields(formId);
      console.log('✅ Поля формы загружены:', formFields.value);
    } catch (err: any) {
      console.error('❌ Ошибка загрузки полей формы:', err);
      error.value = err.message || 'Ошибка загрузки полей формы';
    } finally {
      isLoading.value = false;
    }
  };

  // Отправка ответа на форму
  const submitFormResponse = async (
    formId: number,
    answers: { fieldId: string; value: string | null }[],
    responderId?: string
  ) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const result = await trpcApiClient.postFormResponse(formId, answers, responderId);
      console.log('✅ Ответ отправлен:', result);
      return result;
    } catch (err: any) {
      console.error('❌ Ошибка отправки ответа:', err);
      error.value = err.message || 'Ошибка отправки ответа';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // Состояние
    forms,
    formFields,
    isLoading,
    error,
    
    // Computed
    formsList,
    fieldsList,
    
    // Методы
    fetchForms,
    fetchFormFields,
    submitFormResponse
  };
}
