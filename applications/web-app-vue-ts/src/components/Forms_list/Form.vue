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
    <p class="form-card-statustext">{{ statusText }}</p>
  </div>
</template>

<style scoped>
.form-card-statustext {
  margin-right: 30px;
  font-weight: 800;
}
.form-card {
  font-family: Poppins;
  /* border: 2px solid black; */
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
.form-card--active .form-card-statustext {
  color: red;
}
.form-card--active {
  background-color: rgba(255, 0, 0, 0.275);
  color: red;
  box-shadow: 0 0 8px red;
}
.form-card--inprocess .form-card-statustext {
  color: orange;
}
.form-card--inprocess {
  color: red;
  border: 1px solid red;
}
.form-card--completed .form-card-statustext {
  color: green;
}
.form-card--completed {
  color: gray;
  border: 1px solid gray;
}
.form-card:hover {
  cursor: pointer;
}
</style>
