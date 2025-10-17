import { 
  TelegramValidationSchema, 
  TelegramValidationResponseSchema,
  TelegramAuthResponseSchema
} from "../../shared/schemas";
import { validateTelegramInitData } from "../telegram";
import { generateJWT } from "../jwt";
import { router, publicProcedure } from "../middleware/auth";
import { getBotToken } from "../utils/env";

/**
 * Валидирует initData и возвращает данные или выбрасывает ошибку
 */
function validateAndExtractData(initData: string) {
  const botToken = getBotToken();
  const validatedData = validateTelegramInitData(initData, botToken);
  
  if (!validatedData) {
    throw new Error("Невалидные данные от Telegram");
  }
  
  return validatedData;
}

/**
 * Создает базовый ответ валидации без JWT
 */
function createBaseResponse(validatedData: ReturnType<typeof validateTelegramInitData>) {
  if (!validatedData) {
    throw new Error("Invalid validated data");
  }
  
  return {
    success: true as const,
    user: validatedData.user,
    auth_date: validatedData.auth_date,
    chat_instance: validatedData.chat_instance,
    chat_type: validatedData.chat_type
  };
}

export const telegramRouter = router({
  // Валидация initData от Telegram Mini App (старый метод для совместимости)
  validateTelegramData: publicProcedure
    .input(TelegramValidationSchema)
    .output(TelegramValidationResponseSchema)
    .mutation(async ({ input }) => {
      const validatedData = validateAndExtractData(input.initData);
      return createBaseResponse(validatedData);
    }),

  // авторизация с JWT токеном
  authenticateTelegram: publicProcedure
    .input(TelegramValidationSchema)
    .output(TelegramAuthResponseSchema)
    .mutation(async ({ input }) => {
      const validatedData = validateAndExtractData(input.initData);
      const jwtResponse = generateJWT(validatedData.user);
      
      return {
        ...createBaseResponse(validatedData),
        jwt: jwtResponse
      };
    }),
});
