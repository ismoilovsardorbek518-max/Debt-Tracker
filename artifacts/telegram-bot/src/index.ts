import { createBot } from "./bot.js";
import { ensureTelegramUsersTable } from "./db.js";
import { startScheduler } from "./scheduler.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN muhit o'zgaruvchisi topilmadi.");
}

async function main(): Promise<void> {
  // Jadval mavjud bo'lmasa avtomatik yaratadi
  await ensureTelegramUsersTable();
  console.log("Ma'lumotlar bazasi tayyor.");

  const bot = createBot(token!);

  // Kunlik eslatma schedulerini ishga tushirish
  startScheduler(bot);

  console.log("Telegram bot ishga tushdi...");
  await bot.start();
}

main().catch((err: unknown) => {
  console.error("Bot ishga tushmadi:", err);
  process.exit(1);
});
