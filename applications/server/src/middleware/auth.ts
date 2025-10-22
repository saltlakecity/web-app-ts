import { TRPCError, initTRPC } from '@trpc/server';
import { validateJWT, extractTokenFromHeader } from '../jwt';
import type { JWTPayload } from '../../shared/schemas';
import type { Context } from '../index';

// Тип контекста с пользователем
export interface AuthenticatedContext extends Context {
  user: JWTPayload;
}

// Тип контекста с опциональным пользователем
export interface OptionalAuthContext extends Context {
  user: JWTPayload | null;
}

// Инициализация tRPC с базовым контекстом
const t = initTRPC.context<Context>().create();

/**
 * Middleware для проверки JWT авторизации
 * Добавляет данные пользователя в контекст
 */
export const authMiddleware = t.middleware(async ({ ctx, next }) => {
  // Извлекаем заголовок Authorization из запроса
  const authHeader = ctx.req?.headers?.authorization;
  
  if (!authHeader) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Отсутствует заголовок Authorization',
    });
  }

  // Извлекаем токен из заголовка
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Неверный формат заголовка Authorization. Используйте: Bearer <token>',
    });
  }

  // Валидируем токен
  const payload = validateJWT(token);
  
  if (!payload) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Невалидный или истекший токен',
    });
  }

  // Добавляем данные пользователя в контекст
  return next({
    ctx: {
      ...ctx,
      user: payload,
    },
  });
});

/**
 * Опциональная проверка авторизации
 * Не выбрасывает ошибку если токен отсутствует
 */
export const optionalAuthMiddleware = t.middleware(async ({ ctx, next }) => {
  const authHeader = ctx.req?.headers?.authorization;
  
  if (authHeader) {
    const token = extractTokenFromHeader(authHeader);
    
    if (token) {
      const payload = validateJWT(token);
      
      if (payload) {
        return next({
          ctx: {
            ...ctx,
            user: payload,
          },
        });
      }
    }
  }

  // Если токен отсутствует или невалиден, продолжаем без пользователя
  return next({
    ctx: {
      ...ctx,
      user: null,
    },
  });
});

// Экспортируем процедуры для использования в роутерах
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(authMiddleware);
export const optionalAuthProcedure = t.procedure.use(optionalAuthMiddleware);

// Экспортируем router builder
export const router = t.router;
