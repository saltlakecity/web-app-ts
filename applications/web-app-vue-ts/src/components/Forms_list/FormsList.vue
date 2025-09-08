<script setup lang="ts">
import { onMounted, ref } from "vue";
import Form from "./Form.vue";
import type { FormMeta } from "@/types/types";
import { apiClient } from "@/api/api";

const emit = defineEmits(["form-selected"]);

const forms = ref<FormMeta[]>([]);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await apiClient.getForms();
    // безопасный кейс: если сервер вернул null/undefined, пусть будет пустой массив
    forms.value = Array.isArray(data) ? data : [];
    console.log("[FormsList] loaded", forms.value.length, "forms");
  } catch (err) {
    console.error("[FormsList] failed to load forms:", err);
    error.value = "Ошибка загрузки форм";
  } finally {
    loading.value = false;
  }
});

const handleFormClick = (formId: number) => {
  console.log("[FormsList] form selected:", formId);
  emit("form-selected", formId);
};
</script>

<template>
  <div class="header-logo">
    <span></span>
  </div>

  <div class="forms_container">
    <div v-if="loading">Загрузка форм...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <Form
        v-for="item in forms"
        :key="item.id"
        :form="item"
        @select="() => handleFormClick(item.id)"
      />
      <div v-if="forms.length === 0" class="empty">Форм не найдено</div>
    </div>
  </div>
</template>

<style scoped>
.forms_container {
  display: flex;
  flex-direction: column;
  margin-top: 23vh;
  width: 100%;
  padding: 16px;
}
.header-logo {
  display: flex;
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 23vh;
  background-image: url("/Top.png");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}
.error {
  color: red;
  font-weight: 600;
}
.empty {
  color: #666;
  margin-top: 12px;
}
</style>
