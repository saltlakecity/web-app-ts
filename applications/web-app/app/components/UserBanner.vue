<script setup lang="ts">
const authStore = useAuthStore();
const { user, userId } = storeToRefs(authStore);
</script>

<template>
  <div v-if="user" class="user-banner">
    <span class="user-banner__icon">👤</span>
    <span class="user-banner__name">
      {{ user.first_name }} {{ user.last_name || "" }}
    </span>
    <span v-if="user.username" class="user-banner__username">
      (@{{ user.username }})
    </span>
    <small class="user-banner__id">ID: {{ userId }}</small>
  </div>
</template>

<style lang="scss" scoped>
@use "sass:color";
@use "~/assets/styles/variables" as *;

.user-banner {
  background-color: $color-bg-user;
  padding: calc($spacing-base / 2) $spacing-base;
  margin: $spacing-base;
  border-radius: $border-radius-md;
  font-size: 0.9rem;
  text-align: center;
  border-left: $spacing-xs solid #9c27b0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;

  &__icon {
    margin-right: $spacing-xs;
  }

  &__name {
    font-weight: 600;
  }

  &__username {
    color: color.scale($color-bg-user, $lightness: -40%);
  }

  &__id {
    display: block;
    width: 100%;
    color: $color-text-secondary;
    margin-top: calc($spacing-base / 4);
  }
}
</style>
