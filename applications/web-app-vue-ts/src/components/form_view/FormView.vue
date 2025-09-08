<script setup lang="ts">
import { onMounted, ref } from "vue";
import { apiClient } from "@/api/api";
import type { FormField } from "@/types/types";
const props = defineProps<{
  formId: number;
}>();
const emit = defineEmits(["back"]);
const fields = ref<FormField[]>([]);
const formTitle = ref("");

onMounted(async () => {
  const forms = await apiClient.getForms();
  const currentForm = forms.find((form) => form.id === props.formId);
  formTitle.value = currentForm?.title || "";

  fields.value = await apiClient.getFormFields(props.formId);
});

const handleBack = () => {
  emit("back");
};
</script>
<template>
  <div class="form-view">
    <button @click="handleBack" class="back-button">← Назад</button>
    <h1>{{ formTitle }}</h1>

    <div v-for="field in fields" :key="field.id" class="form-field">
      <label>
        {{ field.label }}
        <span v-if="field.required" class="required">*</span>
      </label>

      <input
        v-if="field.type === 'text'"
        type="text"
        :required="field.required"
      />
    </div>

    <button type="submit" class="submit-button">Отправить</button>
  </div>
</template>

<style scoped>
.form-view {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.back-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #2c3e50;
}

h1 {
  margin: 20px 0;
}

.form-field {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.required {
  color: red;
}

input[type="text"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.submit-button {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
