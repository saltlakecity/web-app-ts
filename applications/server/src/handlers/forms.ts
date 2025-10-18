import { z } from "zod";
import { pool } from "../db";
import { 
  FormMetaSchema, 
  FormFieldSchema, 
  FormResponseSchema 
} from "../../shared/schemas";
import { router, protectedProcedure } from "../middleware/auth";

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
 * Сохраняет ответ на форму с авторизацией пользователя.
 * Возвращает id созданного response
 */
export async function saveResponse(
  formId: number,
  answers: { fieldId: string; value: string | null }[],
  userId: number
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

    // Вставка ответа с привязкой к пользователю
    const insertResp = await client.query(
      "INSERT INTO responses (form_id, created_at, responder_id) VALUES ($1, now(), $2) RETURNING id",
      [formId, userId.toString()]
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

export const formsRouter = router({
  // Получение всех форм (защищенное)
  getForms: protectedProcedure
    .output(FormMetaSchema.array())
    .query(async () => {
      return await fetchForms();
    }),

  // Получение полей формы (защищенное)
  getFormFields: protectedProcedure
    .input(FormFieldSchema.shape.id)
    .output(FormFieldSchema.array())
    .query(async ({ input: formId }) => {
      return await fetchFormFields(formId);
    }),

  // Сохранение ответа на форму (защищенное)
  saveFormResponse: protectedProcedure
    .input(FormResponseSchema)
    .output(z.object({
      success: z.boolean(),
      responseId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const responseId = await saveResponse(
        input.formId,
        input.answers,
        ctx.user.userId
      );
      return {
        success: true,
        responseId,
      };
    }),

  // Получение ответов пользователя на формы
  getUserResponses: protectedProcedure
    .output(z.array(z.object({
      id: z.number(),
      form_id: z.number(),
      form_title: z.string(),
      created_at: z.string(),
    })))
    .query(async ({ ctx }) => {
      const res = await pool.query(`
        SELECT r.id, r.form_id, f.title as form_title, r.created_at
        FROM responses r
        JOIN forms f ON r.form_id = f.id
        WHERE r.responder_id = $1
        ORDER BY r.created_at DESC
      `, [ctx.user.userId.toString()]);
      
      return res.rows;
    }),
});
