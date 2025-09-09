
-- 1) Добавить колонку если её ещё нет
ALTER TABLE form_fields
  ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- 2) Пронумеровать поля внутри каждой формы по возрастанию id (если хотите другое - меняйте ORDER BY)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY form_id ORDER BY id) AS rn
  FROM form_fields
)
UPDATE form_fields f
SET position = o.rn
FROM ordered o
WHERE f.id = o.id;

-- 3) Установить NOT NULL (безопасно, т.к. мы заполнили значения)
ALTER TABLE form_fields
  ALTER COLUMN position SET NOT NULL;