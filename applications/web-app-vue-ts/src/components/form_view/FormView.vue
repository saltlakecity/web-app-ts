<script setup lang="ts">
import { onMounted, ref, reactive } from "vue";
import { apiClient } from "@/api/api";
import type { FormField } from "@/types/types";

const props = defineProps<{
  formId: number;
}>();
const emit = defineEmits(["back"]);

const fields = ref<FormField[]>([]);
const formTitle = ref("");
const loading = ref(false);
const submitting = ref(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

// values: ключ = string(field.id), значение = string (пустая строка по умолчанию)
const values = reactive<Record<string, string>>({});
const fieldErrors = reactive<Record<string, string | null>>({});

// --------------- Загрузка полей и инициализация ---------------
onMounted(async () => {
  loading.value = true;
  try {
    console.log("[FormView] loading fields for form", props.formId);

    // Получаем заголовок формы (как раньше)
    const forms = await apiClient.getForms();
    const currentForm = forms.find((f) => f.id === props.formId);
    formTitle.value = currentForm?.title || `Форма #${props.formId}`;

    // Получаем поля
    const flds = await apiClient.getFormFields(props.formId);
    fields.value = Array.isArray(flds) ? flds : [];

    // Инициализируем значения для каждого поля (строки)
    for (const f of fields.value) {
      const id = String(f.id);
      if (!(id in values)) values[id] = ""; // ← важно: пустая строка, а не null
      if (!(id in fieldErrors)) fieldErrors[id] = null;
    }

    console.log("[FormView] fields loaded:", fields.value.length);
    console.log(
      "[FormView] initial values:",
      JSON.parse(JSON.stringify(values))
    );
  } catch (err) {
    console.error("[FormView] load error:", err);
    errorMessage.value = "Ошибка загрузки формы.";
  } finally {
    loading.value = false;
  }
});

// --------------- Валидация ---------------
function validate(): boolean {
  let ok = true;
  for (const k of Object.keys(fieldErrors)) fieldErrors[k] = null;

  for (const f of fields.value) {
    if (f.required) {
      const id = String(f.id);
      const val = (values[id] ?? "").trim();
      if (val === "") {
        fieldErrors[id] = "Обязательное поле";
        ok = false;
      }
    }
  }
  return ok;
}

// --------------- Отправка ---------------
async function handleSubmit() {
  if (submitting.value) return;
  errorMessage.value = null;
  successMessage.value = null;

  if (!validate()) {
    errorMessage.value = "Пожалуйста, заполните обязательные поля.";
    return;
  }

  // debugging: покажем values, чтобы убедиться, что данные пришли
  console.log(
    "[DEBUG] values snapshot before prepare:",
    JSON.parse(JSON.stringify(values))
  );

  // безопасная подготовка payload
  const answers = fields.value.map((f) => {
    const id = String(f.id);
    const raw = (values[id] ?? "").toString();
    const trimmed = raw.trim();
    return {
      fieldId: id,
      value: trimmed === "" ? null : trimmed, // отправляем null только если пусто
    };
  });

  console.log("[FormView] submitting answers (prepared):", answers);

  submitting.value = true;
  try {
    if (!apiClient.postFormResponse) {
      throw new Error("apiClient.postFormResponse не найден");
    }
    const res = await apiClient.postFormResponse(props.formId, answers);
    console.log("[FormView] submit success:", res);
    successMessage.value = "Ответ успешно отправлен. Спасибо!";

    // очистим значения (опционально)
    for (const f of fields.value) {
      values[String(f.id)] = "";
    }
  } catch (err: any) {
    console.error("[FormView] submit error:", err);
    if (err?.response?.data?.error) {
      errorMessage.value = String(err.response.data.error);
    } else if (err?.message) {
      errorMessage.value = String(err.message);
    } else {
      errorMessage.value = "Ошибка отправки. Попробуйте позже.";
    }
  } finally {
    submitting.value = false;
  }
}

const handleBack = () => emit("back");
</script>

<template>
  <div class="form-view">
    <button @click="handleBack" class="back-button">← Назад</button>
    <h1>{{ formTitle }}</h1>

    <form @submit.prevent="handleSubmit">
      <div v-if="loading">Загрузка...</div>

      <div v-else>
        <div v-for="field in fields" :key="field.id" class="form-field">
          <label :for="field.id">
            {{ field.label }}
            <span v-if="field.required" class="required">*</span>
          </label>

          <!-- Надёжная запись: явно кладём значение в values[id] -->
          <input
            v-if="field.type === 'text'"
            :id="field.id"
            :value="values[String(field.id)]"
            @input="(e) => { values[String(field.id)] = (e.target as HTMLInputElement).value; console.log('[DEBUG] input', String(field.id), (e.target as HTMLInputElement).value); }"
            :required="field.required"
            type="text"
          />

          <div v-if="fieldErrors[String(field.id)]" class="field-error">
            {{ fieldErrors[String(field.id)] }}
          </div>
        </div>

        <div class="actions">
          <button type="submit" :disabled="submitting" class="submit-button">
            {{ submitting ? "Отправка..." : "Отправить" }}
          </button>
        </div>

        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
        <div v-if="successMessage" class="success">{{ successMessage }}</div>
      </div>
    </form>
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
.field-error {
  color: red;
  margin-top: 6px;
  font-size: 0.9rem;
}
.actions {
  margin-top: 18px;
}
.submit-button {
  padding: 10px 20px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.error {
  color: red;
  margin-top: 10px;
}
.success {
  color: green;
  margin-top: 10px;
}
</style>
