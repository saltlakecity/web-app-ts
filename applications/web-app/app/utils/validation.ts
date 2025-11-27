/**
 * Утилиты для валидации и санитизации данных форм
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
 * Минимальная длина для текстовых полей (если требуется)
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
  let sanitized = input
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
 * Проверка на XSS: удаление потенциально опасных HTML тегов
 * Для Vue это не критично, так как {{ }} автоматически экранирует,
 * но полезно для дополнительной защиты
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  
  // Удаляем потенциально опасные паттерны
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
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
  if (!value || value.trim() === "") {
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
  
  if (!allowedOptions.includes(value)) {
    return {
      valid: false,
      error: "Выбран недопустимый вариант",
    };
  }
  
  return { valid: true };
}

/**
 * Комплексная валидация значения поля формы
 */
export function validateFieldValue(
  value: string | null | undefined,
  options: {
    required?: boolean;
    maxLength?: number;
    minLength?: number;
    allowedChoices?: string[];
    fieldType?: string;
  }
): { valid: boolean; error?: string; sanitized?: string } {
  const {
    required = false,
    maxLength = MAX_TEXT_FIELD_LENGTH,
    minLength = MIN_TEXT_FIELD_LENGTH,
    allowedChoices,
    fieldType = "text",
  } = options;

  // Санитизация
  const sanitized = sanitizeString(value, maxLength);

  // Проверка обязательности
  if (required) {
    const requiredCheck = validateRequired(sanitized);
    if (!requiredCheck.valid) {
      return requiredCheck;
    }
  }

  // Если поле необязательное и пустое, пропускаем дальнейшие проверки
  if (!required && sanitized === "") {
    return { valid: true, sanitized: "" };
  }

  // Проверка длины
  const lengthCheck = validateLength(sanitized, minLength, maxLength);
  if (!lengthCheck.valid) {
    return lengthCheck;
  }

  // Проверка выбора для choice полей
  if (fieldType === "choice" && allowedChoices) {
    const choiceCheck = validateChoice(sanitized, allowedChoices);
    if (!choiceCheck.valid) {
      return choiceCheck;
    }
  }

  return { valid: true, sanitized };
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
  ];

  return dangerousPatterns.some((pattern) => pattern.test(value));
}

