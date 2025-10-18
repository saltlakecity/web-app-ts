-- Добавляем telegram_id в response_fields для отслеживания ответов по пользователям
ALTER TABLE response_fields
  ADD COLUMN IF NOT EXISTS responder_id TEXT;

-- Индекс для быстрого поиска ответов пользователя
CREATE INDEX IF NOT EXISTS idx_response_fields_responder_id ON response_fields(responder_id);

-- Обновляем существующие записи, копируя responder_id из responses
UPDATE response_fields
SET responder_id = responses.responder_id
FROM responses
WHERE response_fields.response_id = responses.id
  AND response_fields.responder_id IS NULL;