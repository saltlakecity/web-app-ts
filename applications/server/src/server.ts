import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./router";
import { pool } from "./db";

async function startServer() {
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL");
    client.release();
  } catch (error) {
    console.error(" Ошибка PostgreSQL:", error);
    process.exit(1);
  }

  const server = createHTTPServer({
    router: appRouter,
  });

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  server.listen(port);
  console.log(` tRPC запущен на порту ${port}`);
}

startServer();
