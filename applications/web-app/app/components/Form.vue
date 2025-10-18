<script setup lang="ts">
import type { FormMetaSchema } from '@studsovet/server/shared'
import { z } from 'zod'

const props = defineProps<{
  form: z.infer<typeof FormMetaSchema>
}>()

defineEmits(['select'])

const statusText = computed(() => {
  const statusMap: Record<string, string> = {
    completed: 'Выполнено',
    inprocess: 'В процессе',
    active: 'Активно',
  }
  return props.form.status ? statusMap[props.form.status] || '' : ''
})
</script>

<template>
  <div
    class="form-card"
    :class="`form-card--${form.status}`"
    @click="$emit('select')"
  >
    <h3 class="form-card__title">{{ form.title }}</h3>
    <p class="form-card__status">{{ statusText }}</p>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/styles/variables' as *;

.form-card {
  font-family: 'Poppins', sans-serif;
  border-radius: $border-radius-xl;
  padding: $spacing-lg $spacing-md;
  margin-top: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: transform $transition-fast ease;

  &:hover {
    transform: translateY(-2px);
  }

  &__title {
    margin: 0;
    flex: 1;
  }

  &__status {
    margin: 0 $spacing-xxl 0 0;
    font-weight: 800;
  }

  &--active {
    background-color: rgba($color-form-active, 0.275);
    color: $color-form-active;
    box-shadow: 0 0 $spacing-sm $color-form-active;

    .form-card__status {
      color: $color-form-active;
    }
  }

  &--inprocess {
    color: $color-form-active;
    border: 1px solid $color-form-active;

    .form-card__status {
      color: $color-form-inprocess;
    }
  }

  &--completed {
    color: $color-gray;
    border: 1px solid $color-gray;

    .form-card__status {
      color: $color-form-completed;
    }
  }
}
</style>
