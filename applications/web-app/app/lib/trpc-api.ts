import { trpc } from './trpc';
import type { 
  FormMeta, 
  FormField, 
  FormResponse, 
  TelegramValidationResponse 
} from '@studsovet/server/shared';

export class TRPCApiClient {
  // Получение всех форм
  async getForms(): Promise<FormMeta[]> {
    return await trpc.forms.getForms.query();
  }

  // Получение полей формы
  async getFormFields(formId: number): Promise<FormField[]> {
    return await trpc.forms.getFormFields.query(formId);
  }

  // Сохранение ответа на форму
  async postFormResponse(
    formId: number,
    answers: { fieldId: string; value: string | null }[],
    responderId?: string
  ) {
    const response: FormResponse = {
      formId,
      answers,
      responderId
    };
    
    return await trpc.forms.saveFormResponse.mutate(response);
  }

  // Валидация Telegram данных
  async validateTelegramData(initData: string): Promise<TelegramValidationResponse> {
    return await trpc.telegram.validateTelegramData.mutate({ initData });
  }
}

export const trpcApiClient = new TRPCApiClient();
