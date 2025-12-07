<script setup lang="ts">
import { useFormMeta } from "~/composables/useForms";

const props = defineProps<{
  formId: number;
}>();
const emit = defineEmits(["back"]);

const router = useRouter();
const formIdRef = computed(() => props.formId);
const { formFields, isLoading, error } = useFormFields(formIdRef);
const {
  formMeta,
  isLoading: metaLoading,
  error: metaError,
} = useFormMeta(formIdRef);
const { submitFormResponse, isSubmitting, submitError } = useFormSubmit();

// Фильтруем поля, исключая section_header (они только для отображения)
const inputFields = computed(() => 
  formFields.value.filter(f => f.type !== 'section_header')
);

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
        // Пропускаем заголовки секций - они не требуют ввода
        if (f.type === 'section_header') continue;
        
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

function validate(): boolean {
  let ok = true;
  for (const k of Object.keys(fieldErrors)) fieldErrors[k] = null;

  // Валидируем только обычные поля (не section_header)
  for (const f of inputFields.value) {
    if (f.required) {
      const id = String(f.id);
      const val = (values[id] ?? "").trim();
      if (val === "") {
        fieldErrors[id] = "Обязательное поле";
        ok = false;
      }
    }
  }
  return ok;
}

async function handleSubmit() {
  if (isSubmitting.value) return;
  successMessage.value = null;

  if (!validate()) return;

  // Отправляем только обычные поля (не section_header)
  const answers = inputFields.value.map((f) => {
    const id = String(f.id);
    const trimmed = (values[id] ?? "").trim();
    return {
      fieldId: id,
      value: trimmed === "" ? null : trimmed,
    };
  });

  try {
    await submitFormResponse(props.formId, answers);
    
    // Очищаем форму
    for (const f of inputFields.value) {
      values[String(f.id)] = "";
    }
    
    // Перенаправляем на главный экран после успешной отправки
    router.push('/');
  } catch {
    // Ошибка уже в submitError
  }
}

const handleBack = () => emit("back");

// Динамический отступ формы в зависимости от наличия description
const formTopOffset = computed(() => 
  formMeta.value?.description ? 'calc(23vh + 90px)' : 'calc(23vh + 50px)'
);
</script>

<template>
  <div class="form-detail">
    <div class="form-detail__header">
      <h1 class="form-detail__title">{{ formTitle }}</h1>
    </div>

    <div class="form-detail__nav">
      <button @click="handleBack" class="form-detail__back-btn">←</button>
    </div>

    <div v-if="formMeta?.description" class="form-detail__description">
      {{ formMeta.description }}
    </div>

    <form @submit.prevent="handleSubmit" class="form-detail__form">
      <div v-if="isLoading" class="form-detail__loading">Загрузка...</div>

      <div v-else class="form-detail__content">
        <!-- Секционный заголовок -->
        <template v-for="field in formFields" :key="field.id">
          <div v-if="field.type === 'section_header'" class="form-section-header">
            <h2 class="form-section-header__title">{{ field.label }}</h2>
            <p v-if="field.description" class="form-section-header__description">
              {{ field.description }}
            </p>
          </div>
          
          <!-- Обычное поле -->
          <div
            v-else
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
              :required="field.required"
              type="text"
              class="form-field__input"
            />

            <select
              v-else-if="field.type === 'choice'"
              :id="field.id.toString()"
              v-model="values[String(field.id)]"
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
        </template>

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

  &__header {
    text-align: center;
    background-image: url("/Top.svg");
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    width: 100%;
    height: $header-height;
    position: absolute;
    top: 0;
    left: 0;
    font-size: 14px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__title {
    font-weight: 300;
    text-align: center;
    font-family: "MyFont", sans-serif;
    color: white;
  }

  &__nav {
    position: absolute;
    top: $header-height;
    left: 0;
    width: 100%;
    padding: $spacing-sm $spacing-base;
    box-sizing: border-box;
    z-index: 100;
  }

  &__back-btn {
    @include button-transparent;
    font-size: 24px;
    color: $color-text-primary;
    padding: $spacing-xs;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      color: #881014;
    }
  }

  &__description {
    position: absolute;
    top: calc(#{$header-height} + 48px);
    left: 0;
    width: 100%;
    padding: 0 $spacing-base;
    box-sizing: border-box;
    font-size: 0.9rem;
    color: $color-text-secondary;
    line-height: 1.5;
    text-align: center;
  }

  &__form {
    width: 100%;
    position: absolute;
    top: v-bind(formTopOffset);
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: $spacing-xxl;
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

.form-section-header {
  margin: $spacing-lg 0 $spacing-base;
  padding-bottom: $spacing-sm;
  border-bottom: 2px solid #881014;

  &__title {
    font-family: "Montserrat", sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: $color-text-primary;
    margin: 0 0 $spacing-xs;
  }

  &__description {
    font-family: "Montserrat", sans-serif;
    font-size: 0.85rem;
    color: $color-text-secondary;
    margin: 0;
    line-height: 1.4;
  }
}
</style>
