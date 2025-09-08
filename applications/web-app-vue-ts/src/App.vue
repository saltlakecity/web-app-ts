<script setup lang="ts">
import FormsList from "./components/Forms_list/FormsList.vue";
import FormView from "./components/form_view/FormView.vue";
import { ref } from "vue";

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

  <FormsList
    v-if="!currentFormId"
    @form-selected="handleFormSelect"
  ></FormsList>
  <FormView v-else :form-id="currentFormId" @back="handleBack" />
</template>

<style scoped></style>
