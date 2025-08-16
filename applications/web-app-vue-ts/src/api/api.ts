import axios from "axios";
import type { FormMeta, FormField } from "@/types/types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/", // Используйте переменные окружения при необходимости
  headers: {
    "Content-Type": "application/json",
  },
});

class ApiClient {
  /**
   * Получение списка форм
   */
  async getForms(): Promise<FormMeta[]> {
    const response = await api.get<FormMeta[]>("/forms.json");
    return response.data;
  }

  /**
   * Получение полей конкретной формы
   * @param formId - ID формы
   */
  async getFormFields(formId: number): Promise<FormField[]> {
    const response = await api.get<Record<number, FormField[]>>(
      "/formfields.json"
    );
    return response.data[formId] || [];
  }
}

export const apiClient = new ApiClient();
