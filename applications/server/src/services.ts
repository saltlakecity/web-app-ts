// backend/src/services.ts
import { pool } from "./db";

export type FormMeta = {
  id: number;
  title: string;
  status: string;
};

export type FormField = {
  id: string;
  form_id: number;
  type: string;
  label: string;
  required: boolean;
  position?: number;
};

/**
 * Возвращает все формы
 */
export async function fetchForms(): Promise<FormMeta[]> {
  const res = await pool.query(
    "SELECT id, title, status FROM forms ORDER BY id"
  );
  return res.rows;
}

/**
 * Возвращает поля формы в порядке position, id
 */
export async function fetchFormFields(formId: number): Promise<FormField[]> {
  const res = await pool.query(
    "SELECT id, form_id, type, label, required, position FROM form_fields WHERE form_id = $1 ORDER BY position, id",
    [formId]
  );
  return res.rows;
}

/**
 * Сохраняет ответ на форму с транзакцией.
 * Проверяет required и принадлежность полей.
 * Если передан responderId — проверит, не отправлял ли уже этот респондент.
 *
 * @returns responseId
 */
export async function saveResponse(
  formId: number,
  answers: { fieldId: string; value: string | null }[],
  responderId?: string | null
): Promise<number> {
  const client = await pool.connect();
  try {
    // Если есть responderId — проверим, не отправлял ли уже
    if (responderId) {
      const r = await client.query(
        "SELECT 1 FROM responses WHERE form_id = $1 AND responder_id = $2 LIMIT 1",
        [formId, responderId]
      );
      const rowCount = r.rowCount ?? 0;
      if (rowCount > 0) {
        const err: any = new Error("User already responded");
        err.code = "ALREADY_RESPONDED";
        throw err;
      }
    }

    // Загрузим поля формы и соберём карту допустимых полей
    const fieldsRes = await client.query(
      "SELECT id, required FROM form_fields WHERE form_id = $1",
      [formId]
    );
    const allowedMap = new Map<string, { required: boolean }>();
    for (const row of fieldsRes.rows) {
      allowedMap.set(String(row.id), { required: !!row.required });
    }

    // Проверка: все ответы относятся к существующим полям формы
    for (const a of answers) {
      if (!allowedMap.has(a.fieldId)) {
        throw new Error(`Field ${a.fieldId} does not belong to form ${formId}`);
      }
    }

    // Проверка обязательных полей
    for (const [fieldId, meta] of allowedMap.entries()) {
      if (meta.required) {
        const found = answers.find((x) => x.fieldId === fieldId);
        if (
          !found ||
          found.value === null ||
          String(found.value).trim() === ""
        ) {
          throw new Error(`Required field ${fieldId} is missing or empty`);
        }
      }
    }

    // Сохраняем в транзакции
    await client.query("BEGIN");

    const insertResp = await client.query(
      "INSERT INTO responses (form_id, created_at, responder_id) VALUES ($1, now(), $2) RETURNING id",
      [formId, responderId ?? null]
    );
    const responseId: number = insertResp.rows[0].id;

    const insertText =
      "INSERT INTO response_fields (response_id, field_id, value) VALUES ($1, $2, $3)";
    for (const a of answers) {
      const value =
        a.value === null || a.value === undefined
          ? null
          : String(a.value).slice(0, 10000);
      await client.query(insertText, [responseId, a.fieldId, value]);
    }

    // Опционально: перевод формы в inprocess при первой отправке (если было active)
    await client.query(
      `UPDATE forms
       SET status = 'inprocess'
       WHERE id = $1 AND status = 'active'`,
      [formId]
    );

    await client.query("COMMIT");
    return responseId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
