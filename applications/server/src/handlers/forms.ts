import { z } from "zod";
import { pool } from "../db";
import {
  FormMetaSchema,
  FormFieldSchema,
  FormResponseSchema,
} from "../../shared/schemas";
import { router, protectedProcedure } from "../middleware/auth";

async function fetchForms(userId: number) {
  // Получаем все формы
  const formsRes = await pool.query(
    "SELECT id, title, status FROM forms ORDER BY id"
  );

  // Получаем ID форм, на которые уже отвечал пользователь
  const userResponsesRes = await pool.query(
    "SELECT DISTINCT form_id FROM responses WHERE responder_id = $1",
    [userId.toString()]
  );

  const completedFormIds = new Set(userResponsesRes.rows.map((r) => r.form_id));

  // Добавляем статус прохождения для каждой формы
  const forms = formsRes.rows.map((form) => ({
    ...form,
    user_status: completedFormIds.has(form.id) ? "completed" : "not_completed",
  }));

  return forms;
}

async function fetchFormFields(formId: number) {
  const res = await pool.query(
    "SELECT id, form_id, field_type as type, field_label as label, is_required as required, field_options as options, description FROM form_fields WHERE form_id = $1 ORDER BY position, id",
    [formId]
  );
  return res.rows.map(row => ({
    ...row,
    options: row.options ? JSON.parse(JSON.stringify(row.options)) : undefined
  }));
}

async function fetchFormMeta(formId: number, userId: number) {
  const res = await pool.query(
    "SELECT id, title, status FROM forms WHERE id = $1",
    [formId]
  );

  if (res.rows.length === 0) {
    throw new Error("Form not found");
  }

  const form = res.rows[0];

  // Проверяем, отвечал ли пользователь на эту форму
  const userResponseRes = await pool.query(
    "SELECT id FROM responses WHERE form_id = $1 AND responder_id = $2",
    [formId, userId.toString()]
  );

  const user_status =
    userResponseRes.rows.length > 0 ? "completed" : "not_completed";

  return {
    ...form,
    user_status,
  };
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
      "SELECT id, is_required as required FROM form_fields WHERE form_id = $1",
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

    // Валидация choice полей: выбранное значение должно быть в списке вариантов
    for (const a of answers) {
      if (a.value) {
        const fieldMeta = await client.query(
          "SELECT field_type, field_options FROM form_fields WHERE id = $1",
          [a.fieldId]
        );
        if (fieldMeta.rows.length > 0) {
          const { field_type, field_options } = fieldMeta.rows[0];
          if (field_type === 'choice' && field_options) {
            const options = JSON.parse(JSON.stringify(field_options));
            if (!options.includes(a.value)) {
              throw new Error(`Invalid choice for field ${a.fieldId}: ${a.value}`);
            }
          }
        }
      }
    }

    await client.query("BEGIN");

    // Проверяем, не отвечал ли уже пользователь на эту форму
    const existingResponse = await client.query(
      "SELECT id FROM responses WHERE form_id = $1 AND responder_id = $2",
      [formId, userId.toString()]
    );

    if (existingResponse.rows.length > 0) {
      throw new Error("Вы уже отвечали на эту форму");
    }

    // Вставка ответа с привязкой к пользователю
    const insertResp = await client.query(
      "INSERT INTO responses (form_id, created_at, responder_id) VALUES ($1, now(), $2) RETURNING id",
      [formId, userId.toString()]
    );
    const responseId = insertResp.rows[0].id;

    // Проверяем, что ответ успешно создан
    if (!responseId) {
      throw new Error("Failed to create response record");
    }

    const insertText =
      "INSERT INTO response_fields (response_id, field_id, value, responder_id) VALUES ($1, $2, $3, $4)";
    for (const a of answers) {
      const value =
        a.value === null || a.value === undefined
          ? null
          : String(a.value).slice(0, 10000);
      await client.query(insertText, [
        responseId,
        a.fieldId,
        value,
        userId.toString(),
      ]);
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
    .query(async ({ ctx }) => {
      return await fetchForms(ctx.user.userId);
    }),

  // Получение полей формы (защищенное)
  getFormFields: protectedProcedure
    .input(FormFieldSchema.shape.id)
    .output(FormFieldSchema.array())
    .query(async ({ input: formId }) => {
      return await fetchFormFields(formId);
    }),

  // Получение метаданных формы (защищенное)
  getFormMeta: protectedProcedure
    .input(FormFieldSchema.shape.id)
    .output(FormMetaSchema)
    .query(async ({ input: formId, ctx }) => {
      return await fetchFormMeta(formId, ctx.user.userId);
    }),

  // Сохранение ответа на форму (защищенное)
  saveFormResponse: protectedProcedure
    .input(FormResponseSchema)
    .output(
      z.object({
        success: z.boolean(),
        responseId: z.number(),
      })
    )
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
    .output(
      z.array(
        z.object({
          id: z.number(),
          form_id: z.number(),
          form_title: z.string(),
          created_at: z.string(),
        })
      )
    )
    .query(async ({ ctx }) => {
      const res = await pool.query(
        `
        SELECT r.id, r.form_id, f.title as form_title, r.created_at
        FROM responses r
        JOIN forms f ON r.form_id = f.id
        WHERE r.responder_id = $1
        ORDER BY r.created_at DESC
      `,
        [ctx.user.userId.toString()]
      );

      return res.rows;
    }),
});
