-- Добавление поля description в таблицу form_fields (если еще не добавлено)
ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS description TEXT;