<script setup lang="ts">
import Form from './Form.vue'

const emit = defineEmits(['form-selected'])

const { forms, isLoading, error } = useForms()

const handleFormClick = (formId: number) => emit('form-selected', formId)
</script>

<template>
  <div class="forms-page">
    <div class="forms-page__header"></div>

    <div class="forms-page__container">
      <div v-if="isLoading" class="forms-page__loading">
        Загрузка форм...
      </div>
      <div v-else-if="error" class="forms-page__message forms-page__message--error">
        {{ error }}
      </div>
      <div v-else class="forms-page__list">
        <Form
          v-for="item in forms"
          :key="item.id"
          :form="item"
          @select="() => handleFormClick(item.id)"
        />
        <div v-if="forms.length === 0" class="forms-page__message forms-page__message--empty">
          Форм не найдено
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;

.forms-page {
  position: relative;
  min-height: 100vh;

  &__header {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: $header-height;
    background-image: url('/Top.png');
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
  }

  &__container {
    display: flex;
    flex-direction: column;
    margin-top: $header-height;
    width: 100%;
    padding: $spacing-base;
    box-sizing: border-box;
  }

  &__loading {
    @include loading-state;
  }

  &__message {
    padding: $spacing-md;
    border-radius: $border-radius-sm;

    &--error {
      color: $color-error;
      font-weight: 600;
    }

    &--empty {
      color: $color-text-secondary;
      text-align: center;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
  }
}
</style>
