<script setup lang="ts">
const authStore = useAuthStore();

const { isAuthenticated, user, authError, isLoading } = storeToRefs(authStore);
</script>

<template>
  <div class="layout">
    <div v-if="isLoading" class="layout-state layout-state--loading">
      🔄 Инициализация авторизации...
    </div>

    <div v-else-if="authError" class="layout-state layout-state--error">
      ❌ Ошибка: {{ authError }}
    </div>

    <div v-else-if="isAuthenticated" class="layout__content">
      <UserBanner v-if="user" />
      <NuxtPage />
    </div>

    <div v-else class="layout-state layout-state--error">
      ❌ Не удалось авторизоваться
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "~/assets/styles/variables" as *;

.layout {
  min-height: 100vh;
  width: 100vw;
  margin: 0px;
  padding: 0px;

  &__content {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
}

.layout-state {
  padding: $spacing-base;
  text-align: center;
  margin: $spacing-base;
  border-radius: $border-radius-md;

  &--loading {
    background-color: $color-bg-info;
    color: $color-info;
  }

  &--error {
    background-color: $color-bg-error;
    color: $color-error;
  }
}
</style>
