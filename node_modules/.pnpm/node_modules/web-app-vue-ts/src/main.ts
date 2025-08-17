import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { init } from "@twa-dev/sdk";
createApp(App).mount("#app");

init({
  debug: true,
  version: "7.0",
});
