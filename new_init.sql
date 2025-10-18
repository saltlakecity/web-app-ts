-- Переделка структуры базы данных для опросника

-- Удаляем старые таблицы ответов, если они существуют
DROP TABLE IF EXISTS response_fields CASCADE;
DROP TABLE IF EXISTS responses CASCADE;

-- Таблица форм (оставляем без изменений)
CREATE TABLE IF NOT EXISTS forms (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' -- active, inprocess, closed
);

-- Таблица полей форм (оставляем без изменений)
CREATE TABLE IF NOT EXISTS form_fields (
  id TEXT PRIMARY KEY, -- UUID или уникальный идентификатор поля
  form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- text, select, etc.
  label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0
);

-- Индекс на form_id для form_fields
CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON form_fields(form_id);

-- Новая таблица ответов: каждый ответ сохраняется отдельно и привязывается к форме, полю и респонденту
CREATE TABLE responses (
  id SERIAL PRIMARY KEY,
  form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  value TEXT, -- значение ответа
  responder_id TEXT, -- идентификатор респондента (например, Telegram user ID)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Индекс на form_id для responses
CREATE INDEX idx_responses_form_id ON responses(form_id);

-- Индекс на field_id для responses
CREATE INDEX idx_responses_field_id ON responses(field_id);

-- Индекс на responder_id для responses
CREATE INDEX idx_responses_responder_id ON responses(responder_id);

-- Уникальное ограничение: один респондент может ответить на каждое поле формы только один раз
CREATE UNIQUE INDEX uq_responses_form_field_responder ON responses(form_id, field_id, responder_id);