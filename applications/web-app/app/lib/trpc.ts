import { createTRPCClient, httpLink } from '@trpc/client'
import type { AppRouter } from '@studsovet/server/shared'
import { useAuthStore } from '~/stores/auth'

function createTRPCClientWithToken() {
  const config = useRuntimeConfig()
  const apiUrl = config.public.apiUrl || '/api'
  
  return createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: `${apiUrl}/trpc`,
        headers() {
          const authStore = useAuthStore()
          const token = authStore.jwtToken
          
          return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          }
        },
      }),
    ],
  })
}

export const trpc = createTRPCClientWithToken()

export default trpc
