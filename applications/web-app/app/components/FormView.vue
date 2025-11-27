<script setup lang="ts">
import { useFormMeta } from "~/composables/useForms";
import {
  validateFieldValue,
  sanitizeString,
  MAX_TEXT_FIELD_LENGTH,
} from "~/utils/validation";

// Экспортируем для использования в шаблоне
const MAX_LENGTH = MAX_TEXT_FIELD_LENGTH;

const props = defineProps<{
  formId: number;
}>();
const emit = defineEmits(["back"]);

const formIdRef = computed(() => props.formId);
const { formFields, isLoading, error } = useFormFields(formIdRef);
const {
  formMeta,
  isLoading: metaLoading,
  error: metaError,
} = useFormMeta(formIdRef);
const { submitFormResponse, isSubmitting, submitError } = useFormSubmit();

const formTitle = computed(
  () => formMeta.value?.title || `Форма #${props.formId}`
);
const successMessage = ref<string | null>(null);

const values = reactive<Record<string, string>>({});
const fieldErrors = reactive<Record<string, string | null>>({});

watch(
  formFields,
  (fields) => {
    if (fields) {
      for (const f of fields) {
        const id = String(f.id);
        if (!(id in values)) {
          values[id] = "";
          fieldErrors[id] = null;
        }
      }
    }
  },
  { immediate: true }
);

// Валидация при изменении значения поля
function validateField(fieldId: string) {
  const field = formFields.value.find((f) => String(f.id) === fieldId);
  if (!field) return;

  const value = values[fieldId] ?? "";
  const validation = validateFieldValue(value, {
    required: field.required,
    maxLength: MAX_TEXT_FIELD_LENGTH,
    allowedChoices: field.options,
    fieldType: field.type,
  });

  if (!validation.valid) {
    fieldErrors[fieldId] = validation.error || "Ошибка валидации";
  } else {
    fieldErrors[fieldId] = null;
    // Применяем санитизацию
    if (validation.sanitized !== undefined) {
      values[fieldId] = validation.sanitized;
    }
  }
}

function validate(): boolean {
  let ok = true;
  for (const k of Object.keys(fieldErrors)) fieldErrors[k] = null;

  for (const f of formFields.value) {
    const id = String(f.id);
    const validation = validateFieldValue(values[id] ?? "", {
      required: f.required,
      maxLength: MAX_TEXT_FIELD_LENGTH,
      allowedChoices: f.options,
      fieldType: f.type,
    });

    if (!validation.valid) {
      fieldErrors[id] = validation.error || "Ошибка валидации";
      ok = false;
    }
  }
  return ok;
}

async function handleSubmit() {
  if (isSubmitting.value) return;
  successMessage.value = null;

  if (!validate()) return;

  const answers = formFields.value.map((f) => {
    const id = String(f.id);
    const value = values[id] ?? "";
    // Санитизация перед отправкой
    const sanitized = sanitizeString(value, MAX_TEXT_FIELD_LENGTH);
    return {
      fieldId: id,
      value: sanitized === "" ? null : sanitized,
    };
  });

  try {
    await submitFormResponse(props.formId, answers);
    successMessage.value = "Ответ успешно отправлен. Спасибо!";

    for (const f of formFields.value) {
      values[String(f.id)] = "";
    }
  } catch {
    // Ошибка уже в submitError
  }
}

const handleBack = () => emit("back");
</script>

<template>
  <div class="form-detail">
    <div class="form-detail__header">
      <h1 class="form-detail__title">{{ formTitle }}</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="form-detail__form">
      <div v-if="isLoading" class="form-detail__loading">Загрузка...</div>

      <div v-else class="form-detail__content">
         <button @click="handleBack" class="form-detail__back-btn">←</button>
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

          <div v-if="field.description" class="form-field__description">
            {{ field.description }}
          </div>

          <input
            v-if="field.type === 'text'"
            :id="field.id.toString()"
            v-model="values[String(field.id)]"
            @blur="validateField(String(field.id))"
            @input="validateField(String(field.id))"
            :required="field.required"
            type="text"
            :maxlength="MAX_LENGTH"
            class="form-field__input"
          />

          <select
            v-else-if="field.type === 'choice'"
            :id="field.id.toString()"
            v-model="values[String(field.id)]"
            @change="validateField(String(field.id))"
            :required="field.required"
            class="form-field__select"
          >
            <option value="">Выберите вариант</option>
            <option
              v-for="option in field.options"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>

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
            {{ isSubmitting ? "Отправка..." : "Отправить" }}
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
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

.form-detail {
  @include content-container($max-width-content);
  font-family: "Montserrat", sans-serif;
  position: relative;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  width: 100%;
  background-color: white;
  &__back-btn {
    @include button-transparent;
    font-size: 1rem;
    color: $color-text-primary;
    padding: $spacing-sm 0;
    top: 5px;
    left: 10px;
    font-size: 32px;
    z-index: 9999;
    position: fixed;

  }
  &__header {
    text-align: center;
    margin-bottom: 120px;
    background-image: url("/Top.svg");
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    width: 100%;
    position: absolute;
    font-size: 14px;
    display: flex;
    // flex-direction: row;
    justify-content: center;
    align-items: center;
  }
  &__title {
    color: $color-text-primary;
    font-weight: 300;
    text-align: center;
    font-family: "MyFont", sans-serif;
    color: white;
  }

  &__form {
    width: 100%;
    position: absolute;
    margin-top: 120px;
    align-items: center;
    justify-content: center;
    display: flex;
  }

  &__loading {
    @include loading-state;
    padding: $spacing-xxl $spacing-lg;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $spacing-base;
    margin-right: 10px;
    width: 80%;
  }

  &__actions {
    margin-top: $spacing-sm;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__submit-btn {
    @include button-base;
    background-color: #881014;
    color: white;
    border-radius: 5px;
    font-weight: 700;
    letter-spacing: 0.09em;
    &:hover:not(&--disabled) {
      background-color: color.scale(#881014, $lightness: -30%);
    }
  }

  &__message {
    &--error {
      @include message(
        $color-error,
        color.scale($color-error, $lightness: 45%)
      );
    }

    &--success {
      @include message(
        $color-success,
        color.scale($color-success, $lightness: 55%)
      );
    }
  }
}

.form-field {
  display: flex;
  flex-direction: column;

  &__label {
    display: block;
    margin-bottom: $spacing-sm - 2px;
    font-weight: 500;
    font-family: "Montserrat", sans-serif;
    color: $color-text-primary;
  }

  &__description {
    margin-bottom: $spacing-sm;
    font-size: 0.875rem;
    color: #666;
    font-family: "Montserrat", sans-serif;
    line-height: 1.4;
  }

  &__required {
    color: $color-error;
    margin-left: 2px;
  }

  &__input {
    width: 100%;
    padding: $spacing-md - 2px $spacing-md;
    border: 2px solid gray;
    border-radius: $border-radius-xl;
    font-size: 1rem;
    transition: border-color $transition-base;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #cc1d23;
    }
  }

  &__select {
    width: 100%;
    padding: $spacing-md - 2px $spacing-md;
    border: 2px solid gray;
    border-radius: $border-radius-xl;
    font-size: 1rem;
    transition: border-color $transition-base;
    box-sizing: border-box;
    background-color: white;

    &:focus {
      outline: none;
      border-color: #cc1d23;
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
