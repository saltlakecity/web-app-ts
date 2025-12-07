import { createTRPCClient, httpLink } from "@trpc/client";
import type { AppRouter } from "@studsovet/server/shared";
import { useAuthStore } from "~/stores/auth";

let _trpcClient: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;

function createTRPCClientWithToken() {
  const config = useRuntimeConfig();
  const apiUrl = config.public.apiUrl || "/api";

  return createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: `${apiUrl}/trpc`,
        headers() {
          const authStore = useAuthStore();
          const token = authStore.jwtToken;

          return {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          };
        },
      }),
    ],
  });
}

// Lazy initialization - создаем клиент только при первом использовании
export const trpc = new Proxy(
  {} as ReturnType<typeof createTRPCClient<AppRouter>>,
  {
    get(target, prop) {
      if (!_trpcClient) {
        _trpcClient = createTRPCClientWithToken();
      }
      return Reflect.get(_trpcClient, prop);
    },
  }
);

export default trpc;
