import axios from "axios";
import type { FormMeta, FormField } from "@/types/types";

const base = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: base,
  headers: {
    "Content-Type": "application/json",
  },
});
api.interceptors.request.use(
  (cfg) => {
    console.log(
      `[API] → ${cfg.method?.toUpperCase()} ${cfg.baseURL || ""}${cfg.url}`
    );
    return cfg;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => {
    console.log(`[API] ← ${res.status} ${res.config.url}`);
    return res;
  },
  (err) => {
    console.error("[API] error", err);
    return Promise.reject(err);
  }
);

class ApiClient {
  async getForms(): Promise<FormMeta[]> {
    const response = await api.get<FormMeta[]>("/forms");
    return response.data;
  }

  async getFormFields(formId: number): Promise<FormField[]> {
    const response = await api.get<FormField[]>(`/formfields/${formId}`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
