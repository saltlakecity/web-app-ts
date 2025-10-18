
-- Пронумеровать поля внутри каждой формы по возрастанию id (если хотите другое - меняйте ORDER BY)
-- Это нужно для существующих записей, если они есть
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY form_id ORDER BY id) AS rn
  FROM form_fields
  WHERE position = 0  -- обновляем только записи с дефолтным значением
)
UPDATE form_fields f
SET position = o.rn
FROM ordered o
WHERE f.id = o.id;