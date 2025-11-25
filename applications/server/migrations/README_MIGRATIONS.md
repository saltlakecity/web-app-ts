# Script for applying migrations to Directus

This script automatically applies database schema migrations from SQL files to a Directus instance.

## Features

- **Automatic migration parsing**: Reads all SQL migration files in the directory
- **SQL to Directus translation**: Converts SQL ALTER TABLE statements to Directus API calls
- **Field type mapping**: Maps SQL data types to appropriate Directus field types
- **Data insertion support**: Handles INSERT statements for test data
- **Error handling**: Provides detailed logging and error reporting
- **Idempotent operations**: Safe to run multiple times (won't create duplicate fields)

## Supported Operations

- `ALTER TABLE ADD COLUMN` - Creates new fields in Directus collections
- `CREATE INDEX` - Logs index creation (handled automatically by Directus)
- `INSERT INTO` - Creates sample data records

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Configure the script (if needed):
Edit the following variables in `apply_migrations_to_directus.py`:
- `API_URL` - Directus API URL
- `TOKEN` - Directus API token

## Usage

Run the script from the migrations directory:
```bash
cd applications/server/migrations
python apply_migrations_to_directus.py
```

## What the script does

1. **Reads all SQL files** in the current directory in alphabetical order
2. **Parses SQL statements** to extract schema changes:
   - `ALTER TABLE ADD COLUMN` operations
   - `CREATE INDEX` operations  
   - `INSERT INTO` data operations
3. **Converts SQL types** to Directus field configurations
4. **Applies changes** via Directus API:
   - Creates fields using `/fields/{collection}` endpoint
   - Creates records using `/items/{collection}` endpoint
5. **Reports results** with detailed logging

## Data Type Mapping

| SQL Type | Directus Type | Interface |
|----------|---------------|-----------|
| VARCHAR  | string        | input     |
| TEXT     | text          | input     |
| BOOLEAN  | boolean       | boolean   |
| INTEGER  | integer       | input     |
| SERIAL   | integer       | input     |
| TIMESTAMP| datetime      | datetime  |
| JSONB    | json          | code      |

## Example Output

```
🚀 Начинаем применение миграций к Directus...
📄 Читаем миграцию: 0_initial_schema.sql
📄 Читаем миграцию: 1_form_fields.sql
📄 Читаем миграцию: 2_responses.sql
📊 Найдено 3 операций в 3 файлах

🔧 Обрабатываем операцию: add_column - forms (0_initial_schema.sql)
✅ Создано поле 'description' в коллекции 'forms'

📈 Итоговый отчет:
✅ Успешно выполнено: 3
❌ Ошибок: 0
📊 Всего операций: 3

🎉 Все миграции успешно применены!
```

## Safety Features

- **Duplicate detection**: Skips existing fields (HTTP 409 response)
- **Error recovery**: Continues processing remaining operations on errors
- **Detailed logging**: Shows success/failure for each operation
- **Transaction safety**: Each operation is independent

## Supported Migration Files

The script processes all `.sql` files in the migrations directory:
- `0_initial_schema.sql` - Initial table creation
- `1_form_fields.sql` - Position field updates  
- `2_responses.sql` - Responder ID field
- `3_telegram_ids.sql` - Telegram ID tracking
- `4_choice_field_support.sql` - Choice field options
- `5_add_description_to_form_fields.sql` - Description fields

## Troubleshooting

If you encounter errors:

1. **Check API connectivity**: Ensure Directus is accessible
2. **Verify token**: Make sure the API token is valid and has sufficient permissions
3. **Check collection names**: Directus collection names should match SQL table names
4. **Review field conflicts**: Remove existing conflicting fields manually if needed

## API Permissions Required

The Directus API token must have permissions for:
- `fields:create` - To create new fields
- `items:create` - To create sample data
- Collection-specific permissions for all affected tables