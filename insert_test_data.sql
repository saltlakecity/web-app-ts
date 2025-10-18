-- SQL-скрипт для вставки тестовых данных в таблицы 'forms' и 'form_fields'
-- Предполагается, что таблицы пустые. Если данные уже существуют, скрипт может вызвать ошибки дублирования.
-- Скрипт совместим с PostgreSQL (использует SERIAL и синтаксис PostgreSQL).
-- Для MySQL замените SERIAL на AUTO_INCREMENT и TIMESTAMP WITH TIME ZONE на TIMESTAMP.

-- Вставка тестовых данных в таблицу forms
-- Пример 1: Форма обратной связи
INSERT INTO forms (status, title) VALUES ('active', 'Форма обратной связи');

-- Пример 2: Форма регистрации
INSERT INTO forms (status, title) VALUES ('active', 'Форма регистрации пользователя');

-- Пример 3: Форма опроса
INSERT INTO forms (status, title) VALUES ('active', 'Опрос о предпочтениях');

-- Вставка тестовых данных в таблицу form_fields
-- Поля для формы 1 (обратная связь, предполагаем id=1)
INSERT INTO form_fields (form_id, field_type, field_name, field_label, is_required, position) VALUES (1, 'text', 'name', 'Ваше имя', true, 1);
INSERT INTO form_fields (form_id, field_type, field_name, field_label, is_required, position) VALUES (1, 'email', 'email', 'Email', true, 2);
INSERT INTO form_fields (form_id, field_type, field_name, field_label, is_required, position) VALUES (1, 'textarea', 'message', 'Сообщение', false, 3);

-- Поля для формы 2 (регистрация, предполагаем id=2)
INSERT INTO form_fields (form_id, field_type, field_name, field_label, is_required, position) VALUES (2, 'text', 'username', 'Имя пользователя', true, 1);
INSERT INTO form_fields (form_id, field_type, field_name, field_label, is_required, position) VALUES (2, 'password', 'password', 'Пароль', true, 2);
INSERT INTO form_fields (form_id, field_type, field_name, field_label, is_required, position) VALUES (2, 'checkbox', 'agree', 'Согласие с условиями', true, 3);

-- Поля для формы 3 (опрос, предполагаем id=3)
INSERT INTO form_fields (form_id, field_type, field_name, field_label, is_required, position) VALUES (3, 'radio', 'favorite_color', 'Любимый цвет', false, 1);
INSERT INTO form_fields (form_id, field_type, field_name, field_label, is_required, position) VALUES (3, 'select', 'age_group', 'Возрастная группа', false, 2);