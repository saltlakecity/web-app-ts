#!/usr/bin/env python3
"""
Парсер данных из PostgreSQL в Excel.
Извлекает ответы на формы и записывает их в Excel-файл.
"""

import argparse
import logging
import sys
from database import connect_to_db, get_form_data, get_available_forms
from excel_writer import write_to_excel
from config import DEFAULT_OUTPUT_FILE

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    # Парсер аргументов командной строки
    parser = argparse.ArgumentParser(description='Парсер данных из PostgreSQL в Excel')
    parser.add_argument('--output', '-o', default=DEFAULT_OUTPUT_FILE,
                        help=f'Путь к выходному Excel-файлу (по умолчанию: {DEFAULT_OUTPUT_FILE})')
    parser.add_argument('--form-id', '-f', type=int, required=True,
                        help='ID формы для экспорта данных')

    args = parser.parse_args()

    # Подключаемся к базе данных
    conn = connect_to_db()
    if not conn:
        logger.error("Не удалось подключиться к базе данных. Завершение работы.")
        sys.exit(1)

    try:
        # Проверяем, существует ли форма с указанным ID
        forms = get_available_forms(conn)
        form_ids = [form[0] for form in forms]
        if args.form_id not in form_ids:
            logger.error(f"Форма с ID {args.form_id} не найдена. Доступные формы:")
            for form_id, title in forms:
                print(f"  ID: {form_id}, Title: {title}")
            sys.exit(1)

        # Извлекаем данные
        user_data, field_list = get_form_data(conn, args.form_id)
        if not user_data:
            logger.warning(f"Нет данных для формы {args.form_id}.")
            sys.exit(0)

        # Записываем в Excel
        write_to_excel(user_data, field_list, args.output)
        logger.info("Экспорт завершен успешно.")

    except Exception as e:
        logger.error(f"Произошла ошибка: {e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()
            logger.info("Соединение с базой данных закрыто.")

if __name__ == "__main__":
    main()