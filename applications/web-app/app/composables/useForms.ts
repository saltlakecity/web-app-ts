import type { FormMeta, FormField } from '@studsovet/server/shared'

export function useForms() {
  const api = useApi()

  const { data: forms, pending: formsLoading, error: formsError, refresh: fetchForms } = useLazyAsyncData(
    'forms',
    () => api.getForms(),
    { default: () => [] }
  )

  return {
    forms,
    isLoading: formsLoading,
    error: formsError,
    fetchForms,
  }
}

export function useFormFields(formId: Ref<number>) {
  const api = useApi()
  const key = computed(() => `form-fields-${formId.value}`)

  const { data: formFields, pending: fieldsLoading, error: fieldsError, refresh: fetchFormFields } = useLazyAsyncData(
    key,
    () => api.getFormFields(formId.value),
    { 
      default: () => [],
      watch: [formId]
    }
  )

  return {
    formFields,
    isLoading: fieldsLoading,
    error: fieldsError,
    fetchFormFields,
  }
}

export function useFormSubmit() {
  const api = useApi()
  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)

  const submitFormResponse = async (
    formId: number,
    answers: { fieldId: string; value: string | null }[]
  ) => {
    isSubmitting.value = true
    submitError.value = null

    try {
      const result = await api.postFormResponse(formId, answers)
      return result
    } catch (err: any) {
      submitError.value = err.message || 'Ошибка отправки ответа'
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    submitFormResponse,
    isSubmitting,
    submitError,
  }
}
