<script setup lang="ts">
import FormsList from "./components/forms/FormsList.vue";
import FormView from "./components/form-view/FormView.vue";
import { ref } from "vue";
import { useTelegramAuth } from "./composables/useTelegramAuth";

const { isValidated, user, validationError, isLoading, userId } = useTelegramAuth();

const currentFormId = ref<number | null>(null);

const handleFormSelect = (formId: number) => {
  currentFormId.value = formId;
};

const handleBack = () => {
  currentFormId.value = null;
};
</script>

<template>
  <!-- TODO 3. Переписать логику форм на postgres, таблицы через directus-->
  
  <!-- Индикатор загрузки -->
  <div v-if="isLoading" class="loading">
    🔄 Валидация Telegram данных...
  </div>
  
  <!-- Ошибка валидации -->
  <div v-else-if="validationError" class="error">
    ❌ Ошибка: {{ validationError }}
  </div>
  
  <!-- Основной интерфейс -->
  <div v-else-if="isValidated">
    <!-- Информация о пользователе (можно скрыть в production) -->
    <div class="user-info" v-if="user">
      👤 {{ user.first_name }} {{ user.last_name || '' }}
      <span v-if="user.username">(@{{ user.username }})</span>
      <small>ID: {{ userId }}</small>
    </div>

    <FormsList
      v-if="!currentFormId"
      @form-selected="handleFormSelect"
    />
    <FormView v-else :form-id="currentFormId" @back="handleBack" />
  </div>
  
  <!-- Если не удалось валидировать -->
  <div v-else class="error">
    ❌ Не удалось загрузить данные пользователя
  </div>
</template>

<style scoped>
.loading, .error {
  padding: 1rem;
  text-align: center;
  margin: 1rem;
  border-radius: 8px;
}

.loading {
  background-color: #e3f2fd;
  color: #1976d2;
}

.error {
  background-color: #ffebee;
  color: #d32f2f;
}

.user-info {
  background-color: #f3e5f5;
  padding: 0.5rem 1rem;
  margin: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
  border-left: 4px solid #9c27b0;
}

.user-info small {
  display: block;
  color: #666;
  margin-top: 0.25rem;
}
</style>
