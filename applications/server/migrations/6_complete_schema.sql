-- Полная миграция всех полей таблиц в Directus
-- Этот файл обеспечивает создание ВСЕХ полей, которые должны быть в таблицах

-- ===== FORMS TABLE =====
-- Добавляем все недостающие поля в таблицу forms

ALTER TABLE forms ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'active';
ALTER TABLE forms ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE forms ADD COLUMN IF NOT EXISTS description TEXT;

-- ===== FORM_FIELDS TABLE =====
-- Добавляем все недостающие поля в таблицу form_fields

ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS form_id INTEGER;
ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS field_type VARCHAR(50) NOT NULL DEFAULT 'text';
ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS field_name VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS field_label VARCHAR(255);
ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT FALSE;
ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS field_options JSONB;

-- ===== RESPONSES TABLE =====
-- Добавляем все недостающие поля в таблицу responses

ALTER TABLE responses ADD COLUMN IF NOT EXISTS form_id INTEGER;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE responses ADD COLUMN IF NOT EXISTS responder_id TEXT;

-- ===== RESPONSE_FIELDS TABLE =====
-- Добавляем все недостающие поля в таблицу response_fields

ALTER TABLE response_fields ADD COLUMN IF NOT EXISTS response_id INTEGER;
ALTER TABLE response_fields ADD COLUMN IF NOT EXISTS field_id TEXT NOT NULL;
ALTER TABLE response_fields ADD COLUMN IF NOT EXISTS value TEXT;
ALTER TABLE response_fields ADD COLUMN IF NOT EXISTS responder_id TEXT;

-- Создаем пример данных для проверки
INSERT INTO form_fields (form_id, field_type, field_name, field_label, is_required, position, field_options, description)
VALUES 
(1, 'choice', 'favorite_color', 'Любимый цвет', true, 1, '["Красный", "Синий", "Зеленый", "Желтый"]'::jsonb, 'проверка'),
(1, 'text', 'user_name', 'Ваше имя', true, 2, NULL, 'Поле для ввода имени пользователя'),
(1, 'email', 'user_email', 'Email адрес', true, 3, NULL, 'Email для связи');