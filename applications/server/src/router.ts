// src/router.ts
import { initTRPC } from "@trpc/server";
import { pool } from "./db";

const t = initTRPC.create();

// helper: получить формы
async function fetchForms() {
  const res = await pool.query(
    "SELECT id, title, status FROM forms ORDER BY id"
  );
  return res.rows;
}

// helper: получить поля формы
async function fetchFormFields(formId: number) {
  const res = await pool.query(
    "SELECT id, form_id, type, label, required FROM form_fields WHERE form_id = $1 ORDER BY id",
    [formId]
  );
  return res.rows;
}

export const appRouter = t.router({
  getForms: t.procedure.query(async () => {
    return await fetchForms();
  }),
  getFormFields: t.procedure
    .input((val: unknown) => {
      if (typeof val === "number") return val;
      throw new Error("Expected number");
    })
    .query(async (opts) => {
      const formId = opts.input as number;
      return await fetchFormFields(formId);
    }),
});

export type AppRouter = typeof appRouter;

export const services = {
  fetchForms,
  fetchFormFields,
};
