import psycopg2
import logging
from config import DB_CONFIG

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def connect_to_db():
    """
    Подключается к базе данных PostgreSQL с использованием конфигурации из config.py.
    Возвращает объект соединения или None в случае ошибки.
    """
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        logger.info("Успешное подключение к базе данных.")
        return conn
    except psycopg2.Error as e:
        logger.error(f"Ошибка подключения к базе данных: {e}")
        return None

def get_form_data(conn, form_id):
    """
    Извлекает данные из таблиц responses и response_fields для указанной формы.
    Возвращает словарь с данными: ключи - telegram_id, значения - словари {position: field_value}
    и список полей с их позициями и метками.
    """
    try:
        with conn.cursor() as cursor:
            # Получаем все поля формы с их позициями и метками
            fields_query = """
            SELECT id, position, field_label
            FROM form_fields
            WHERE form_id = %s
            ORDER BY position
            """
            cursor.execute(fields_query, (form_id,))
            fields = cursor.fetchall()

            # Получаем все ответы пользователей
            responses_query = """
            SELECT DISTINCT rf.responder_id
            FROM response_fields rf
            JOIN responses r ON rf.response_id = r.id
            WHERE r.form_id = %s AND rf.responder_id IS NOT NULL
            ORDER BY rf.responder_id
            """
            cursor.execute(responses_query, (form_id,))
            users = [row[0] for row in cursor.fetchall()]

            # Получаем все ответы
            data_query = """
            SELECT rf.responder_id, ff.position, rf.value
            FROM response_fields rf
            JOIN responses r ON rf.response_id = r.id
            JOIN form_fields ff ON rf.field_id::int = ff.id
            WHERE r.form_id = %s AND rf.responder_id IS NOT NULL
            ORDER BY rf.responder_id, ff.position
            """
            cursor.execute(data_query, (form_id,))
            responses = cursor.fetchall()

            # Организуем данные: user_data[telegram_id][position] = value
            user_data = {}
            for user in users:
                user_data[user] = {}

            for row in responses:
                telegram_id, position, value = row
                user_data[telegram_id][position] = value

            # Преобразуем поля в список словарей
            field_list = [{'id': f[0], 'position': f[1], 'label': f[2]} for f in fields]

            logger.info(f"Извлечено {len(user_data)} пользователей и {len(field_list)} полей для формы {form_id}.")
            return user_data, field_list
    except psycopg2.Error as e:
        logger.error(f"Ошибка при извлечении данных: {e}")
        return {}, []

def get_available_forms(conn):
    """
    Получает список доступных форм (id и title).
    Возвращает список кортежей (id, title).
    """
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, title FROM forms ORDER BY id")
            forms = cursor.fetchall()
            logger.info(f"Найдено {len(forms)} форм.")
            return forms
    except psycopg2.Error as e:
        logger.error(f"Ошибка при получении списка форм: {e}")
        return []