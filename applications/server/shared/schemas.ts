// Zod схемы для валидации данных

import { z } from 'zod';

// Схемы для форм
export const FormMetaSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: z.string().optional(),
});
export type FormMeta = z.infer<typeof FormMetaSchema>;

export const FormFieldSchema = z.object({
  id: z.number(),
  form_id: z.number(),
  type: z.string(),
  label: z.string(),
  required: z.boolean().optional(),
});
export type FormField = z.infer<typeof FormFieldSchema>;

export const FormResponseSchema = z.object({
  formId: z.number(),
  answers: z.array(z.object({
    fieldId: z.string(),
    value: z.string().nullable(),
  })),
  responderId: z.string().optional(),
});
export type FormResponse = z.infer<typeof FormResponseSchema>;

// Схемы для Telegram
export const TelegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
  is_premium: z.boolean().optional(),
  photo_url: z.string().optional(),
});
export type TelegramUser = z.infer<typeof TelegramUserSchema>;

export const TelegramValidationSchema = z.object({
  initData: z.string(),
});
export type TelegramValidation = z.infer<typeof TelegramValidationSchema>;

export const TelegramValidationResponseSchema = z.object({
  success: z.boolean(),
  user: TelegramUserSchema,
  auth_date: z.number(),
  chat_instance: z.string().optional(),
  chat_type: z.string().optional(),
});
export type TelegramValidationResponse = z.infer<typeof TelegramValidationResponseSchema>;

// JWT схемы
export const JWTPayloadSchema = z.object({
  userId: z.number(),
  username: z.string().optional(),
  firstName: z.string(),
  lastName: z.string().optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

export const JWTResponseSchema = z.object({
  token: z.string(),
  expiresIn: z.number(),
});
export type JWTResponse = z.infer<typeof JWTResponseSchema>;

export const TelegramAuthResponseSchema = z.object({
  success: z.boolean(),
  user: TelegramUserSchema,
  auth_date: z.number(),
  chat_instance: z.string().optional(),
  chat_type: z.string().optional(),
  jwt: JWTResponseSchema,
});
export type TelegramAuthResponse = z.infer<typeof TelegramAuthResponseSchema>;

// Схемы для API ответов
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});
export type ApiResponse = z.infer<typeof ApiResponseSchema>;