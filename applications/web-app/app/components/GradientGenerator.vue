<script setup lang="ts">
import { ref, computed } from "vue";

interface ColorStop {
  color: string;
  position: number;
}

const colors = ref<ColorStop[]>([
  { color: "#ff0000", position: 0 },
  { color: "#0000ff", position: 100 },
]);

const direction = ref("to right");
const type = ref("linear");

const gradientStyle = computed(() => {
  const stops = colors.value
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(", ");
  return `${type.value}-gradient(${direction.value}, ${stops})`;
});

const addColor = () => {
  const lastColor = colors.value[colors.value.length - 1];
  const newPosition = lastColor ? lastColor.position + 25 : 50;
  colors.value.push({ color: "#00ff00", position: Math.min(newPosition, 100) });
};

const removeColor = (index: number) => {
  if (colors.value.length > 2) {
    colors.value.splice(index, 1);
  }
};

const exportCSS = () => {
  const css = `background: ${gradientStyle.value};`;
  const blob = new Blob([css], { type: "text/css" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gradient.css";
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<template>
  <div class="gradient-generator">
    <div class="controls">
      <div class="control-group">
        <label>Тип градиента:</label>
        <select v-model="type">
          <option value="linear">Линейный</option>
          <option value="radial">Радиальный</option>
        </select>
      </div>

      <div v-if="type === 'linear'" class="control-group">
        <label>Направление:</label>
        <select v-model="direction">
          <option value="to right">Вправо</option>
          <option value="to left">Влево</option>
          <option value="to bottom">Вниз</option>
          <option value="to top">Вверх</option>
          <option value="to bottom right">Вниз вправо</option>
          <option value="to bottom left">Вниз влево</option>
          <option value="to top right">Вверх вправо</option>
          <option value="to top left">Вверх влево</option>
        </select>
      </div>

      <div class="colors">
        <h3>Цвета:</h3>
        <div
          v-for="(colorStop, index) in colors"
          :key="index"
          class="color-stop"
        >
          <input type="color" v-model="colorStop.color" />
          <input
            type="range"
            min="0"
            max="100"
            v-model.number="colorStop.position"
          />
          <span>{{ colorStop.position }}%</span>
          <button @click="removeColor(index)" :disabled="colors.length <= 2">
            Удалить
          </button>
        </div>
        <button @click="addColor">Добавить цвет</button>
      </div>

      <button @click="exportCSS" class="export-btn">Экспортировать CSS</button>
    </div>

    <div class="preview">
      <div
        class="gradient-preview"
        :style="{ background: gradientStyle }"
      ></div>
      <div class="css-code">
        <pre>background: {{ gradientStyle }};</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gradient-generator {
  display: flex;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.controls {
  flex: 1;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.control-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.colors {
  margin-top: 20px;
}

.color-stop {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.color-stop input[type="color"] {
  width: 50px;
  height: 40px;
  border: none;
  cursor: pointer;
}

.color-stop input[type="range"] {
  flex: 1;
}

.export-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.export-btn:hover {
  background: #0056b3;
}

.preview {
  flex: 1;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.gradient-preview {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.css-code {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
}

.css-code pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
