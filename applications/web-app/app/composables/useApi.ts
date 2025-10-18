import { trpc } from "~/lib/trpc";
import type {
  FormMeta,
  FormField,
  FormResponse,
  TelegramAuthResponse,
} from "@studsovet/server/shared";

export function useApi() {
  const getForms = async (): Promise<FormMeta[]> => {
    return await trpc.forms.getForms.query();
  };

  const getFormFields = async (formId: number): Promise<FormField[]> => {
    return await trpc.forms.getFormFields.query(formId);
  };

  const getFormMeta = async (formId: number): Promise<FormMeta> => {
    return await trpc.forms.getFormMeta.query(formId);
  };

  const postFormResponse = async (
    formId: number,
    answers: { fieldId: string; value: string | null }[]
  ) => {
    return await trpc.forms.saveFormResponse.mutate({ formId, answers });
  };

  const getUserResponses = async () => {
    return await trpc.forms.getUserResponses.query();
  };

  const authenticateTelegram = async (
    initData: string
  ): Promise<TelegramAuthResponse> => {
    return await trpc.telegram.authenticateTelegram.mutate({ initData });
  };

  return {
    getForms,
    getFormFields,
    getFormMeta,
    postFormResponse,
    getUserResponses,
    authenticateTelegram,
  };
}
