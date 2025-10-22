import type { JWTPayload, TelegramUser } from '@studsovet/server/shared'

/**
 * Парсит JWT токен и возвращает payload
 */
export function parseJwtPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts[1]) return null
    
    const payload = JSON.parse(atob(parts[1]))
    return payload
  } catch {
    return null
  }
}

/**
 * Проверяет валидность JWT токена
 */
export function isJwtValid(token: string): boolean {
  const payload = parseJwtPayload(token)
  if (!payload?.exp) return false
  
  const currentTime = Math.floor(Date.now() / 1000)
  return payload.exp > currentTime
}

/**
 * Получает дату истечения токена
 */
export function getJwtExpiry(token: string): Date | null {
  const payload = parseJwtPayload(token)
  if (!payload?.exp) return null
  
  return new Date(payload.exp * 1000)
}

/**
 * Восстанавливает данные пользователя из JWT payload
 */
export function getUserFromJwt(token: string): TelegramUser | null {
  const payload = parseJwtPayload(token)
  if (!payload) return null
  
  return {
    id: payload.userId,
    first_name: payload.firstName,
    last_name: payload.lastName,
    username: payload.username
  }
}

