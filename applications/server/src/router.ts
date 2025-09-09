import { initTRPC } from "@trpc/server";
import { pool } from "./db";

const t = initTRPC.create();

async function fetchForms() {
  const res = await pool.query(
    "SELECT id, title, status FROM forms ORDER BY id"
  );
  return res.rows;
}

async function fetchFormFields(formId: number) {
  const res = await pool.query(
    "SELECT id, form_id, type, label, required FROM form_fields WHERE form_id = $1 ORDER BY id",
    [formId]
  );
  return res.rows;
}

/**
 * Сохраняет ответ на форму.
 * @param formId - id формы
 * @param answers - массив { fieldId: string, value: string }
 * Возвращает id созданного response
 */
export async function saveResponse(
  formId: number,
  answers: { fieldId: string; value: string | null }[],
  responderId?: string | null
) {
  const client = await pool.connect();
  try {
    const { rows: allowedFields } = await client.query(
      "SELECT id, required FROM form_fields WHERE form_id = $1",
      [formId]
    );
    const allowedMap = new Map<string, { required: boolean }>();
    for (const r of allowedFields)
      allowedMap.set(String(r.id), { required: !!r.required });

    // Валидация: все поля должны принадлежать форме
    for (const a of answers) {
      if (!allowedMap.has(a.fieldId)) {
        throw new Error(`Field ${a.fieldId} does not belong to form ${formId}`);
      }
    }
    // Валидация: обязательные поля должны быть заполнены
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

    await client.query("BEGIN");

    // Вставка ответа
    const insertResp = await client.query(
      "INSERT INTO responses (form_id, created_at, responder_id) VALUES ($1, now(), $2) RETURNING id",
      [formId, responderId ?? null]
    );
    const responseId = insertResp.rows[0].id;

    const insertText =
      "INSERT INTO response_fields (response_id, field_id, value) VALUES ($1, $2, $3)";
    for (const a of answers) {
      const value =
        a.value === null || a.value === undefined
          ? null
          : String(a.value).slice(0, 10000);
      await client.query(insertText, [responseId, a.fieldId, value]);
    }

    await client.query("COMMIT");
    return responseId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export const appRouter = t.router({
  getForms: t.procedure.query(async () => fetchForms()),
  getFormFields: t.procedure
    .input((val: unknown) => {
      if (typeof val === "number") return val;
      throw new Error("Expected number");
    })
    .query(async (opts) => fetchFormFields(opts.input as number)),
});

export type AppRouter = typeof appRouter;

export const services = {
  fetchForms,
  fetchFormFields,
  saveResponse,
};
