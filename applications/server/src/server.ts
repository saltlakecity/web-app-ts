// src/server.ts
import express from "express";
import cors from "cors";
import { json } from "body-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import morgan from "morgan";
import dotenv from "dotenv";
import { appRouter, services } from "./router";
import { pool } from "./db";

dotenv.config();

async function startServer() {
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL: connected");
    client.release();
  } catch (err) {
    console.error("❌ PostgreSQL: connection error", err);
    process.exit(1);
  }

  const app = express();
  app.use(
    morgan(
      ":remote-addr :method :url :status :res[content-length] - :response-time ms"
    )
  );

  app.use(json());
  // в проде заменить origin вместо true на конкретный домен фронтенда
  app.use(
    cors({
      origin: true,
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true,
    })
  );

  // --- REST endpoints ---
  app.get("/api/health", async (req, res) => {
    try {
      // Небольшая проверка БД
      const result = await pool.query("SELECT 1");
      const dbOk = !!result;
      return res.json({ ok: true, db: dbOk });
    } catch (err) {
      console.error("/api/health DB check failed:", err);
      return res.status(500).json({ ok: false, db: false });
    }
  });

  app.get("/api/forms", async (req, res) => {
    try {
      const rows = await services.fetchForms();
      res.json(
        rows.map((r: any) => ({ id: r.id, title: r.title, status: r.status }))
      );
    } catch (err) {
      console.error("GET /api/forms error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/formfields/:formId", async (req, res) => {
    const formId = Number(req.params.formId);
    if (Number.isNaN(formId)) {
      return res.status(400).json({ error: "Invalid formId" });
    }
    try {
      const rows = await services.fetchFormFields(formId);
      const fields = rows.map((r: any) => ({
        id: r.id,
        form_id: r.form_id,
        type: r.type,
        label: r.label,
        required: !!r.required,
      }));
      res.json(fields);
    } catch (err) {
      console.error(`GET /api/formfields/${formId} error:`, err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: () => ({}),
    })
  );

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  app.listen(port, () => {
    console.log(`🚀 API server (Express + tRPC) запущен на порту ${port}`);
    console.log(`ℹ️ Health: GET /api/health`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
