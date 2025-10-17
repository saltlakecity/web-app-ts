import { createTRPCClient, httpLink } from '@trpc/client';
import type { AppRouter } from '@studsovet/server/shared';

// Создаем tRPC клиент без строгой типизации для совместимости
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: '/api/trpc',
      // Настройки для запросов
      headers() {
        return {
          'Content-Type': 'application/json',
        };
      },
    }),
  ],
});

export default trpc;
