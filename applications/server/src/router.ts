import { router } from "./middleware/auth";
import { formsRouter } from "./handlers/forms";
import { telegramRouter } from "./handlers/telegram";

export const appRouter = router({
  // Все роуты теперь защищены JWT авторизацией
  forms: formsRouter,
  telegram: telegramRouter,
});

export type AppRouter = typeof appRouter;
