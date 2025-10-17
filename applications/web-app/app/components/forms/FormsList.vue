<script setup lang="ts">
import { onMounted } from "vue";
import Form from "./Form.vue";

const emit = defineEmits(["form-selected"]);

const { forms, isLoading, error, fetchForms } = useForms();

onMounted(async () => {
  await fetchForms();
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
    <div v-if="isLoading">Загрузка форм...</div>
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
