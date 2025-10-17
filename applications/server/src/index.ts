import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router";
import { pool } from "./db";

const app = express();
app.use(cors());


// Health-check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// tRPC endpoint
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
    onError: ({ error, path, input }) => {
      console.error(`❌ tRPC Error on ${path}:`, error);
      console.error('Input:', input);
      console.error('Error cause:', error.cause);
    },
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
      console.log(`🚀 tRPC API server запущен на порту ${port}`);
      console.log(`📡 tRPC endpoint: http://localhost:${port}/api/trpc`);
    });
  })
  .catch((err) => {
    console.error("❌ Ошибка подключения к PostgreSQL:", err);
    process.exit(1);
  });
