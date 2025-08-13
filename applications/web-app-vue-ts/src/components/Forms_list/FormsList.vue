<script setup lang="ts">
import { ref } from "vue";
import Form from "./Form.vue";
import formsData from "./forms.json";
import type { FormMeta } from "./Form.vue";

const forms = ref<FormMeta[]>(formsData);
</script>

<template>
  <div class="header-logo">
    <span></span>
  </div>
  <div class="forms_container">
    <Form v-for="item in forms" :key="item.id" :form="item"></Form>
  </div>
</template>

<style scoped>
.forms_container {
  display: flex;
  flex-direction: column;
  margin-top: 23vh;
  width: 100%;
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
</style>
