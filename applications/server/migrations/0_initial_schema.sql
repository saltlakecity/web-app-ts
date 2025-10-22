-- forms: хранит основную информацию о форме
CREATE TABLE IF NOT EXISTS forms (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL
);

-- form_fields: хранит поля формы
CREATE TABLE IF NOT EXISTS form_fields (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    field_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    field_label VARCHAR(255),
    is_required BOOLEAN DEFAULT FALSE,
    position INTEGER DEFAULT 0 NOT NULL
);

-- responses: хранит сам ответ (одну отправку формы)
CREATE TABLE IF NOT EXISTS responses (
  id SERIAL PRIMARY KEY,
  form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- response_fields: хранит конкретные ответы на поля (каждая строка = ответ на одно поле)
CREATE TABLE IF NOT EXISTS response_fields (
  id SERIAL PRIMARY KEY,
  response_id INTEGER NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL, -- соответствует form_fields.id
  value TEXT, -- значение, хранится как текст; можно расширить под типы позже
  CONSTRAINT uq_response_field UNIQUE (response_id, field_id)
);

-- индекс на response_id для ускорения выборок
CREATE INDEX IF NOT EXISTS idx_response_fields_response_id ON response_fields(response_id);

-- индекс на form_id (responses)
CREATE INDEX IF NOT EXISTS idx_responses_form_id ON responses(form_id);

-- индекс на form_id (form_fields)
CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON form_fields(form_id);