import { initTRPC } from "@trpc/server";
import { formsRouter } from "./handlers/forms";
import { telegramRouter } from "./handlers/telegram";

const t = initTRPC.create();

export const appRouter = t.router({
  forms: formsRouter,
  telegram: telegramRouter,
});

export type AppRouter = typeof appRouter;
