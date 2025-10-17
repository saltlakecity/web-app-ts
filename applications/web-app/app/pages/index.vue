<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const router = useRouter()

const handleFormSelect = (formId: number) => {
  router.push(`/forms/${formId}`)
}
</script>

<template>
  <FormsList @form-selected="handleFormSelect" />
</template>

