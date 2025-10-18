<script setup lang="ts">
const props = defineProps<{
  formId: number
}>()
const emit = defineEmits(['back'])

const formIdRef = computed(() => props.formId)
const { formFields, isLoading, error } = useFormFields(formIdRef)
const { submitFormResponse, isSubmitting, submitError } = useFormSubmit()

const formTitle = computed(() => `Форма #${props.formId}`)
const successMessage = ref<string | null>(null)

const values = reactive<Record<string, string>>({})
const fieldErrors = reactive<Record<string, string | null>>({})

watch(formFields, (fields) => {
  if (fields) {
    for (const f of fields) {
      const id = String(f.id)
      if (!(id in values)) {
        values[id] = ''
        fieldErrors[id] = null
      }
    }
  }
}, { immediate: true })

function validate(): boolean {
  let ok = true
  for (const k of Object.keys(fieldErrors)) fieldErrors[k] = null

  for (const f of formFields.value) {
    if (f.required) {
      const id = String(f.id)
      const val = (values[id] ?? '').trim()
      if (val === '') {
        fieldErrors[id] = 'Обязательное поле'
        ok = false
      }
    }
  }
  return ok
}

async function handleSubmit() {
  if (isSubmitting.value) return
  successMessage.value = null

  if (!validate()) return

  const answers = formFields.value.map((f) => {
    const id = String(f.id)
    const trimmed = (values[id] ?? '').trim()
    return {
      fieldId: id,
      value: trimmed === '' ? null : trimmed,
    }
  })

  try {
    await submitFormResponse(props.formId, answers)
    successMessage.value = 'Ответ успешно отправлен. Спасибо!'

    for (const f of formFields.value) {
      values[String(f.id)] = ''
    }
  } catch {
    // Ошибка уже в submitError
  }
}

const handleBack = () => emit('back')
</script>

<template>
  <div class="form-detail">
    <button @click="handleBack" class="form-detail__back-btn">
      ← Назад
    </button>
    <h1 class="form-detail__title">{{ formTitle }}</h1>

    <form @submit.prevent="handleSubmit" class="form-detail__form">
      <div v-if="isLoading" class="form-detail__loading">
        Загрузка...
      </div>

      <div v-else class="form-detail__content">
        <div 
          v-for="field in formFields" 
          :key="field.id" 
          class="form-field"
          :class="{ 'form-field--error': fieldErrors[String(field.id)] }"
        >
          <label :for="field.id.toString()" class="form-field__label">
            {{ field.label }}
            <span v-if="field.required" class="form-field__required">*</span>
          </label>

          <input
            v-if="field.type === 'text'"
            :id="field.id.toString()"
            v-model="values[String(field.id)]"
            :required="field.required"
            type="text"
            class="form-field__input"
          />

          <div v-if="fieldErrors[String(field.id)]" class="form-field__error">
            {{ fieldErrors[String(field.id)] }}
          </div>
        </div>

        <div class="form-detail__actions">
          <button 
            type="submit" 
            :disabled="isSubmitting" 
            class="form-detail__submit-btn"
            :class="{ 'form-detail__submit-btn--disabled': isSubmitting }"
          >
            {{ isSubmitting ? 'Отправка...' : 'Отправить' }}
          </button>
        </div>

        <div 
          v-if="error || submitError" 
          class="form-detail__message form-detail__message--error"
        >
          {{ error?.message || submitError }}
        </div>
        <div 
          v-if="successMessage" 
          class="form-detail__message form-detail__message--success"
        >
          {{ successMessage }}
        </div>
      </div>
    </form>
  </div>
</template>

<style lang="scss" scoped>
@use "sass:color";
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;

.form-detail {
  @include content-container($max-width-content);

  &__back-btn {
    @include button-transparent;
    font-size: 1.2rem;
    color: $color-text-primary;
    padding: $spacing-sm 0;
  }

  &__title {
    margin: $spacing-base 0 $spacing-xl;
    color: $color-text-primary;
  }

  &__form {
    width: 100%;
  }

  &__loading {
    @include loading-state;
    padding: $spacing-xxl $spacing-lg;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $spacing-base;
  }

  &__actions {
    margin-top: $spacing-sm;
  }

  &__submit-btn {
    @include button-base;
    background-color: $color-primary;
    color: white;

    &:hover:not(&--disabled) {
      background-color: color.scale($color-primary, $lightness: -10%);
    }
  }

  &__message {
    &--error {
      @include message($color-error, color.scale($color-error, $lightness: 45%));
    }

    &--success {
      @include message($color-success, color.scale($color-success, $lightness: 55%));
    }
  }
}

.form-field {
  display: flex;
  flex-direction: column;

  &__label {
    display: block;
    margin-bottom: $spacing-sm - 2px;
    font-weight: 600;
    color: $color-text-primary;
  }

  &__required {
    color: $color-error;
    margin-left: 2px;
  }

  &__input {
    width: 100%;
    padding: $spacing-md - 2px $spacing-md;
    border: 2px solid $color-border;
    border-radius: $border-radius-sm;
    font-size: 1rem;
    transition: border-color $transition-base;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: $color-border-focus;
    }
  }

  &__error {
    color: $color-error;
    margin-top: $spacing-sm - 2px;
    font-size: 0.875rem;
  }

  &--error &__input {
    border-color: $color-border-error;
  }
}
</style>
