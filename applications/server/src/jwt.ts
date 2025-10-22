import jwt from 'jsonwebtoken';
import type { TelegramUser, JWTPayload, JWTResponse } from '../shared/schemas';
import { getJwtSecret } from './utils/env';

/**
 * Генерирует JWT токен для пользователя Telegram
 */
export function generateJWT(user: TelegramUser): JWTResponse {
  const secret = getJwtSecret();

  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
  };

  const expiresIn = 60 * 10; // 10 минут
  
  const token = jwt.sign(payload, secret, { 
    expiresIn,
    issuer: 'studsovet-api',
    audience: 'studsovet-app'
  });

  return {
    token,
    expiresIn
  };
}

/**
 * Валидирует JWT токен
 */
export function validateJWT(token: string): JWTPayload | null {
  const secret = getJwtSecret();

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'studsovet-api',
      audience: 'studsovet-app'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    console.error('Ошибка валидации JWT:', error);
    return null;
  }
}

/**
 * Извлекает токен из заголовка Authorization
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
