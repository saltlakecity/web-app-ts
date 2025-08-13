<script setup lang="ts">
// import formsData from "./forms.json";
import { computed, ref } from "vue";
export interface FormMeta {
  id: number;
  title: string;
  status: string;
}
const props = defineProps<{
  form: FormMeta;
}>();
const statusText = computed(() => {
  switch (props.form.status) {
    case "completed":
      return "Выполнено";
    case "inprocess":
      return "В процессе";
    case "active":
      return "Активно";
    default:
      return "";
  }
});
</script>

<template>
  <div class="form-card" :class="`form-card--${form.status}`">
    <h3>{{ form.title }}</h3>
    <div class="form-card-statustext">
      <p>Статус:</p>
      <p>{{ statusText }}</p>
    </div>
  </div>
</template>

<style scoped>
.form-card {
  font-family: Poppins;
  border: 2px solid black;
  border-radius: 30px;
  padding: 10px;
  padding-top: 20px;
  padding-bottom: 20px;
  margin-top: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.form-card-statustext {
  display: flex;
  flex-direction: row;
}
.form-card--active .form-card-statustext p:nth-child(2) {
  color: red;
  margin-left: 6px;
}
.form-card--inprocess .form-card-statustext p:nth-child(2) {
  color: orange;
  margin-left: 6px;
}
.form-card--completed .form-card-statustext p:nth-child(2) {
  color: green;
  margin-left: 6px;
}
.form-card:hover {
  cursor: pointer;
}
</style>
