-- Добавляем поддержку для поля типа "choice"
-- Добавляем колонку для хранения вариантов выбора в JSON формате
ALTER TABLE form_fields
  ADD COLUMN IF NOT EXISTS field_options JSONB;

-- Добавляем колонку description если её еще нет
ALTER TABLE form_fields
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Индекс для поиска по типу поля
CREATE INDEX IF NOT EXISTS idx_form_fields_field_type ON form_fields(field_type);

-- Пример вставки тестового поля с вариантами (закомментирован)
-- INSERT INTO form_fields (form_id, field_type, field_name, field_label, is_required, position, field_options, description)
-- VALUES (1, 'choice', 'favorite_color', 'Любимый цвет', true, 1, '["Красный", "Синий", "Зеленый", "Желтый"]'::jsonb, 'Выберите ваш любимый цвет');