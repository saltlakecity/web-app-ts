/**
 * Серверные утилиты для валидации и санитизации данных форм
 */

/**
 * Максимальная длина значения поля формы
 */
export const MAX_FIELD_VALUE_LENGTH = 10000;

/**
 * Максимальная длина для обычных текстовых полей
 */
export const MAX_TEXT_FIELD_LENGTH = 5000;

/**
 * Минимальная длина для текстовых полей
 */
export const MIN_TEXT_FIELD_LENGTH = 0;

/**
 * Санитизация строки: удаление опасных символов и обрезка
 */
export function sanitizeString(
  input: string | null | undefined,
  maxLength: number = MAX_FIELD_VALUE_LENGTH
): string {
  if (!input) return "";
  
  // Удаляем нулевые байты и другие опасные символы
  let sanitized = String(input)
    .replace(/\0/g, "") // Удаляем нулевые байты
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Удаляем управляющие символы
    .trim();
  
  // Ограничиваем длину
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Проверка на потенциально опасные паттерны
 */
export function containsDangerousPatterns(value: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /data:text\/html/i,
    /vbscript:/i,
    /<object/i,
    /<embed/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(value));
}

/**
 * Валидация длины строки
 */
export function validateLength(
  value: string,
  min: number = MIN_TEXT_FIELD_LENGTH,
  max: number = MAX_TEXT_FIELD_LENGTH
): { valid: boolean; error?: string } {
  const length = value.trim().length;
  
  if (length < min) {
    return {
      valid: false,
      error: `Минимальная длина: ${min} символов`,
    };
  }
  
  if (length > max) {
    return {
      valid: false,
      error: `Максимальная длина: ${max} символов`,
    };
  }
  
  return { valid: true };
}

/**
 * Валидация обязательного поля
 */
export function validateRequired(
  value: string | null | undefined
): { valid: boolean; error?: string } {
  if (!value || String(value).trim() === "") {
    return {
      valid: false,
      error: "Обязательное поле",
    };
  }
  
  return { valid: true };
}

/**
 * Валидация выбора из списка (для choice полей)
 */
export function validateChoice(
  value: string | null | undefined,
  allowedOptions: string[]
): { valid: boolean; error?: string } {
  if (!value) {
    return { valid: true }; // Пустое значение допустимо для необязательных полей
  }
  
  if (!allowedOptions.includes(String(value))) {
    return {
      valid: false,
      error: `Invalid choice: ${value}`,
    };
  }
  
  return { valid: true };
}

