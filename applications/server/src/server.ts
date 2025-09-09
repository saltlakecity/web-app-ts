import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter, services } from "./router";
import { pool } from "./db";

const app = express();
app.use(cors());
app.use(express.json());

// Health-check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// REST: список форм
app.get("/api/forms", async (req, res) => {
  try {
    const forms = await services.fetchForms();
    res.json(forms);
  } catch (err) {
    console.error("Ошибка при получении форм:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// REST: поля конкретной формы
app.get("/api/formfields/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const fields = await services.fetchFormFields(Number(id));
    res.json(fields);
  } catch (err) {
    console.error("Ошибка при получении полей:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// REST: отправка ответов
app.post("/api/forms/:id/responses", async (req, res) => {
  const { id } = req.params;
  const { answers, responderId } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Неверный формат данных" });
  }

  try {
    const responseId = await services.saveResponse(
      Number(id),
      answers,
      responderId ?? null
    );
    res.json({ success: true, responseId });
  } catch (err) {
    console.error("Ошибка при сохранении ответа:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// tRPC (пока что не используем, но можно дергать)
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
  })
);

const port = process.env.PORT || 3000;

// Проверка подключения к БД и запуск сервера
pool
  .connect()
  .then((client) => {
    console.log("✅ PostgreSQL: connected");
    client.release();

    app.listen(port, () => {
      console.log(`🚀 API server (Express + tRPC) запущен на порту ${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Ошибка подключения к PostgreSQL:", err);
    process.exit(1);
  });
