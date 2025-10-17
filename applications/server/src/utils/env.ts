/**
 * Утилиты для проверки переменных окружения
 */

/**
 * Получает обязательную переменную окружения
 * @returns значение переменной
 * @throws Error если переменная не установлена
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  
  if (!value) {
    throw new Error(`${name} не настроен в переменных окружения`);
  }
  
  return value;
}

/**
 * Получает BOT_TOKEN из переменных окружения
 * @returns BOT_TOKEN
 * @throws Error если токен не установлен
 */
export function getBotToken(): string {
  return getRequiredEnv('BOT_TOKEN');
}

/**
 * Получает JWT_SECRET из переменных окружения
 * @returns JWT_SECRET
 * @throws Error если секрет не установлен
 */
export function getJwtSecret(): string {
  return getRequiredEnv('JWT_SECRET');
}

