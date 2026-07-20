import http from "node:http";
import { createBot } from "./bot.js";
import { ensureTelegramUsersTable } from "./db.js";
import { startScheduler } from "./scheduler.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN muhit o'zgaruvchisi topilmadi.");
}

// Render web servis sifatida ishlashi uchun minimal HTTP server
const port = Number(process.env.PORT ?? 3000);
const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Debt Tracker Bot ishlayapti ✓");
});
server.listen(port, () => {
  console.log(`Health check server: http://0.0.0.0:${port}`);
});

async function main(): Promise<void> {
  await ensureTelegramUsersTable();
  console.log("Ma'lumotlar bazasi tayyor.");

  const bot = createBot(token!);
  startScheduler(bot);

  console.log("Telegram bot ishga tushdi...");
  await bot.start();
}

main().catch((err: unknown) => {
  console.error("Bot ishga tushmadi:", err);
  process.exit(1);
});
