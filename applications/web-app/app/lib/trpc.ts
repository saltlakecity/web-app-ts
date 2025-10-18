import { createTRPCClient, httpLink } from '@trpc/client'
import type { AppRouter } from '@studsovet/server/shared'
import { useAuthStore } from '~/stores/auth'

function createTRPCClientWithToken() {
  return createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: '/api/trpc',
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
