import { initTRPC } from "@trpc/server";
import { 
  TelegramValidationSchema, 
  TelegramValidationResponseSchema 
} from "../schemas";
import { validateTelegramInitData } from "../telegram";

const t = initTRPC.create();

export const telegramRouter = t.router({
  // Валидация initData от Telegram Mini App
  validateTelegramData: t.procedure
    .input(TelegramValidationSchema)
    .output(TelegramValidationResponseSchema)
    .mutation(async ({ input }) => {
      const botToken = process.env.BOT_TOKEN;
      
      if (!botToken) {
        throw new Error("BOT_TOKEN не настроен");
      }
      
      const validatedData = validateTelegramInitData(input.initData, botToken);
      
      if (!validatedData) {
        throw new Error("Невалидные данные от Telegram");
      }
      
      return {
        success: true,
        user: validatedData.user,
        auth_date: validatedData.auth_date,
        chat_instance: validatedData.chat_instance,
        chat_type: validatedData.chat_type
      };
    }),
});
