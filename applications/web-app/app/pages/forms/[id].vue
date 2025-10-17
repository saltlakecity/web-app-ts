<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()

const formId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? parseInt(id, 10) : 0
})

const handleBack = () => {
  router.push('/')
}
</script>

<template>
  <FormView :form-id="formId" @back="handleBack" />
</template>

