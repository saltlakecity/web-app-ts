#!/usr/bin/env python3
"""
Скрипт для применения миграций базы данных к Directus
Читает SQL файлы миграций и создает соответствующие поля в Directus
"""

import re
import os
import requests
import json
from typing import List, Dict, Any, Optional
from pathlib import Path

# Конфигурация Directus API
API_URL = "https://api.studsovet.kosygin-rsu.ru"
TOKEN = "Z--i8pfKr19Y445ZRTbjKfnYVbVCQFN1"

# Директория с миграциями
MIGRATIONS_DIR = Path(__file__).parent

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Сопоставление типов данных SQL -> Directus
SQL_TO_DIRECTUS_TYPE_MAPPING = {
    'VARCHAR': 'string',
    'TEXT': 'text',
    'BOOLEAN': 'boolean',
    'INTEGER': 'integer',
    'SERIAL': 'integer',
    'TIMESTAMP': 'timestamp',
    'JSONB': 'json'
}

class DirectusMigrationError(Exception):
    """Исключение для ошибок миграции"""
    pass

class MigrationParser:
    """Парсер SQL миграций"""
    
    def __init__(self):
        self.alter_statements = []
        self.create_index_statements = []
    
    def parse_migration_file(self, file_path: Path) -> List[Dict[str, Any]]:
        """Парсит файл миграции и извлекает операции"""
        operations = []
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Удаляем комментарии
        content = re.sub(r'--.*$', '', content, flags=re.MULTILINE)
        
        # Ищем CREATE TABLE statements для извлечения полей
        create_table_pattern = r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\((.*?)\);'
        create_tables = re.findall(create_table_pattern, content, re.DOTALL | re.IGNORECASE)
        
        for table_name, table_definition in create_tables:
            # Парсим определения полей в CREATE TABLE
            field_pattern = r'(\w+)\s+(\w+(?:\([^)]*\))?)\s*(?:NOT\s+NULL|DEFAULT[^,]*)?(?:\s+REFERENCES\s+[^\s)]+)?(?:\s+ON\s+DELETE\s+\w+)?(?:\s+ON\s+UPDATE\s+\w+)?(?:,|\s*$)'
            fields = re.findall(field_pattern, table_definition, re.IGNORECASE)
            
            for field_name, data_type in fields:
                # Пропускаем некоторые системные поля
                if field_name.upper() in ['SERIAL', 'PRIMARY', 'CONSTRAINT', 'INDEX', 'KEY']:
                    continue
                    
                operations.append({
                    'type': 'add_column',
                    'table': table_name.lower(),
                    'column': field_name.lower(),
                    'data_type': data_type.strip(),
                    'file': file_path.name,
                    'source': 'create_table'
                })
        
        # Ищем ALTER TABLE statements
        alter_pattern = r'ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+([^;]+);'
        alters = re.findall(alter_pattern, content, re.IGNORECASE)
        
        for table, column, data_type in alters:
            operations.append({
                'type': 'add_column',
                'table': table.lower(),
                'column': column.lower(),
                'data_type': data_type.strip(),
                'file': file_path.name,
                'source': 'alter_table'
            })
        
        # Ищем CREATE INDEX statements
        index_pattern = r'CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\);'
        indexes = re.findall(index_pattern, content, re.IGNORECASE)
        
        for index_name, table, columns in indexes:
            operations.append({
                'type': 'create_index',
                'table': table.lower(),
                'index_name': index_name.lower(),
                'columns': [col.strip() for col in columns.split(',')],
                'file': file_path.name,
                'source': 'create_index'
            })
        
        # Ищем INSERT statements (пример данных)
        insert_pattern = r'INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\);'
        inserts = re.findall(insert_pattern, content, re.IGNORECASE)
        
        for table, columns, values in inserts:
            # Парсим колонки и значения
            columns_list = [col.strip() for col in columns.split(',')]
            values_list = self._parse_values(values)
            
            if len(columns_list) == len(values_list):
                data = dict(zip(columns_list, values_list))
                operations.append({
                    'type': 'insert_data',
                    'table': table.lower(),
                    'data': data,
                    'file': file_path.name,
                    'source': 'insert_data'
                })
        
        return operations
    
    def _parse_values(self, values_str: str) -> List[Any]:
        """Парсит значения из SQL INSERT"""
        values = []
        current_value = ""
        in_quotes = False
        escape_next = False
        
        for char in values_str.strip():
            if escape_next:
                current_value += char
                escape_next = False
                continue
                
            if char == '\\':
                escape_next = True
                continue
                
            if char == "'":
                in_quotes = not in_quotes
                continue
                
            if char == ',' and not in_quotes:
                values.append(current_value.strip())
                current_value = ""
            else:
                current_value += char
        
        if current_value.strip():
            values.append(current_value.strip())
        
        # Преобразуем в правильные типы
        parsed_values = []
        for val in values:
            if val.upper() == 'NULL':
                parsed_values.append(None)
            elif val.upper() == 'TRUE':
                parsed_values.append(True)
            elif val.upper() == 'FALSE':
                parsed_values.append(False)
            elif val.startswith('[') and val.endswith(']'):
                # JSON array
                try:
                    parsed_values.append(json.loads(val.replace("'", '"')))
                except:
                    parsed_values.append(val)
            else:
                try:
                    # Попробуем как число
                    if '.' in val:
                        parsed_values.append(float(val))
                    else:
                        parsed_values.append(int(val))
                except ValueError:
                    # Строка
                    parsed_values.append(val)
        
        return parsed_values

class DirectusFieldManager:
    """Менеджер для работы с полями Directus"""
    
    def __init__(self, api_url: str, headers: Dict[str, str]):
        self.api_url = api_url.rstrip('/')
        self.headers = headers
    
    def create_field(self, collection: str, field_name: str, field_config: Dict[str, Any]) -> bool:
        """Создает поле в Directus коллекции"""
        url = f"{self.api_url}/fields/{collection}"
        
        payload = {
            "field": field_name,
            **field_config
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=payload)
            if response.status_code in (200, 201):
                print(f"✅ Создано поле '{field_name}' в коллекции '{collection}'")
                return True
            elif response.status_code == 409:
                print(f"⚠️  Поле '{field_name}' в коллекции '{collection}' уже существует")
                return True
            elif response.status_code == 400:
                # Проверяем, является ли ошибка результатом того, что поле уже существует
                try:
                    error_data = response.json()
                    if "already exists" in error_data.get("errors", [{}])[0].get("message", "").lower():
                        print(f"⚠️  Поле '{field_name}' в коллекции '{collection}' уже существует")
                        return True
                except:
                    pass
                print(f"❌ Ошибка создания поля '{field_name}' в коллекции '{collection}': {response.status_code} {response.text}")
                return False
            else:
                print(f"❌ Ошибка создания поля '{field_name}' в коллекции '{collection}': {response.status_code} {response.text}")
                return False
        except Exception as e:
            print(f"❌ Исключение при создании поля '{field_name}' в коллекции '{collection}': {e}")
            return False
    
    def create_record(self, collection: str, data: Dict[str, Any]) -> bool:
        """Создает запись в Directus коллекции"""
        url = f"{self.api_url}/items/{collection}"
        
        payload = {"data": data}
        
        try:
            response = requests.post(url, headers=self.headers, json=payload)
            if response.status_code in (200, 201):
                print(f"✅ Создана запись в коллекции '{collection}'")
                return True
            else:
                print(f"❌ Ошибка создания записи в коллекции '{collection}': {response.status_code} {response.text}")
                return False
        except Exception as e:
            print(f"❌ Исключение при создании записи в коллекции '{collection}': {e}")
            return False

def sql_type_to_directus_config(sql_type: str) -> Dict[str, Any]:
    """Преобразует SQL тип в конфигурацию Directus поля"""
    sql_type_upper = sql_type.upper().strip()
    
    # Извлекаем основной тип и параметры
    match = re.match(r'(\w+)(\([^)]*\))?', sql_type_upper)
    if not match:
        return {"type": "string"}
    
    base_type = match.group(1)
    
    # Базовая конфигурация по типу
    if base_type in SQL_TO_DIRECTUS_TYPE_MAPPING:
        directus_type = SQL_TO_DIRECTUS_TYPE_MAPPING[base_type]
        
        config = {"type": directus_type}
        
        # Дополнительные настройки для специфических типов
        if base_type == 'VARCHAR' or base_type == 'TEXT':
            config["meta"] = {"interface": "input"}
        elif base_type == 'BOOLEAN':
            config["meta"] = {"interface": "boolean"}
        elif base_type == 'TIMESTAMP':
            config["meta"] = {"interface": "datetime"}
        elif base_type == 'JSONB':
            config["meta"] = {"interface": "code"}
            config["type"] = "json"
        
        return config
    
    # По умолчанию - строка
    return {"type": "string", "meta": {"interface": "input"}}

def apply_migrations():
    """Основная функция применения миграций"""
    print("🚀 Начинаем применение миграций к Directus...")
    
    # Инициализируем менеджер Directus
    field_manager = DirectusFieldManager(API_URL, headers)
    
    # Инициализируем парсер
    parser = MigrationParser()
    
    # Получаем все файлы миграций в порядке
    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    
    if not migration_files:
        print("❌ Файлы миграций не найдены в директории")
        return
    
    all_operations = []
    
    # Парсим все миграции
    for migration_file in migration_files:
        print(f"📄 Читаем миграцию: {migration_file.name}")
        operations = parser.parse_migration_file(migration_file)
        all_operations.extend(operations)
    
    print(f"📊 Найдено {len(all_operations)} операций в {len(migration_files)} файлах")
    
    # Применяем операции
    success_count = 0
    error_count = 0
    
    for operation in all_operations:
        print(f"\n🔧 Обрабатываем операцию: {operation['type']} - {operation.get('table', 'N/A')} ({operation['file']})")
        
        if operation['type'] == 'add_column':
            # Создаем поле в Directus
            directus_config = sql_type_to_directus_config(operation['data_type'])
            directus_config['schema'] = {"name": operation['column']}
            
            if field_manager.create_field(operation['table'], operation['column'], directus_config):
                success_count += 1
            else:
                error_count += 1
        
        elif operation['type'] == 'insert_data':
            # Создаем запись с данными
            if field_manager.create_record(operation['table'], operation['data']):
                success_count += 1
            else:
                error_count += 1
        
        elif operation['type'] == 'create_index':
            # Индексы в Directus создаются автоматически, просто логируем
            print(f"ℹ️  Индекс {operation['index_name']} в таблице {operation['table']} будет создан автоматически")
            success_count += 1
    
    # Итоговый отчет
    print(f"\n📈 Итоговый отчет:")
    print(f"✅ Успешно выполнено: {success_count}")
    print(f"❌ Ошибок: {error_count}")
    print(f"📊 Всего операций: {success_count + error_count}")
    
    if error_count == 0:
        print("\n🎉 Все миграции успешно применены!")
    else:
        print(f"\n⚠️  Применено {success_count} операций, {error_count} с ошибками")

if __name__ == "__main__":
    try:
        apply_migrations()
    except KeyboardInterrupt:
        print("\n\n⛔ Применение миграций прервано пользователем")
    except Exception as e:
        print(f"\n💥 Критическая ошибка: {e}")
        raise