import crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramInitData {
  user: TelegramUser;
  chat_instance?: string;
  chat_type?: string;
  auth_date: number;
  hash: string;
}

/**
 * Валидирует initData от Telegram Mini App
 * @param initData - строка initData от Telegram
 * @param botToken - токен бота
 * @returns валидированные данные или null если невалидно
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string
): TelegramInitData | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      return null;
    }

    // Удаляем hash из параметров для проверки подписи
    urlParams.delete('hash');
    
    // Сортируем параметры
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаем секретный ключ
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Проверяем подпись
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return null;
    }

    // Проверяем время (данные не старше 24 часов)
    const authDate = parseInt(urlParams.get('auth_date') || '0');
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (currentTime - authDate > 86400) { // 24 часа
      return null;
    }

    // Парсим данные пользователя
    const userParam = urlParams.get('user');
    if (!userParam) {
      return null;
    }

    const user = JSON.parse(userParam) as TelegramUser;
    
    return {
      user,
      chat_instance: urlParams.get('chat_instance') || undefined,
      chat_type: urlParams.get('chat_type') || undefined,
      auth_date: authDate,
      hash
    };
  } catch (error) {
    console.error('Ошибка валидации initData:', error);
    return null;
  }
}

/**
 * Извлекает пользователя из валидированных данных
 */
export function extractUserFromInitData(initData: string, botToken: string): TelegramUser | null {
  const validatedData = validateTelegramInitData(initData, botToken);
  return validatedData?.user || null;
}
