import { z } from "zod";

export const FormMetaSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: z.string().optional(),
});

export const FormFieldSchema = z.object({
  id: z.number(),
  form_id: z.number(),
  type: z.string(),
  label: z.string(),
  required: z.boolean().optional(),
});

export const FormResponseSchema = z.object({
  formId: z.number(),
  answers: z.array(z.object({
    fieldId: z.string(),
    value: z.string().nullable(),
  })),
  responderId: z.string().optional(),
});

export const TelegramValidationSchema = z.object({
  initData: z.string(),
});

export const TelegramValidationResponseSchema = z.object({
  success: z.boolean(),
  user: z.object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string().optional(),
    username: z.string().optional(),
    language_code: z.string().optional(),
    is_premium: z.boolean().optional(),
    photo_url: z.string().optional(),
  }),
  auth_date: z.number(),
  chat_instance: z.string().optional(),
  chat_type: z.string().optional(),
});
