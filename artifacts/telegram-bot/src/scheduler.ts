import cron from "node-cron";
import type { Bot } from "grammy";
import { getAllRegisteredUsers, getOverdueClients } from "./db.js";


function formatAmount(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

export function startScheduler(bot: Bot): void {
  // Har kuni soat 09:00 da Toshkent vaqti bo'yicha (UTC+5 = 04:00 UTC)
  cron.schedule(
    "0 4 * * *",
    async () => {
      let users: Awaited<ReturnType<typeof getAllRegisteredUsers>>;
      try {
        users = await getAllRegisteredUsers();
      } catch {
        return;
      }

      for (const user of users) {
        try {
          const overdue = await getOverdueClients(user.responsiblePerson, 10);
          if (overdue.length === 0) continue;

          let msg = `⏰ *Kunlik eslatma — muddati o'tgan qarzlar*\n\n`;
          for (const c of overdue) {
            msg += `👤 *${c.name}*`;
            if (c.territory) msg += ` (${c.territory})`;
            msg += `\n   💰 ${formatAmount(c.debt)} so'm — *${c.daysSince} kun*\n\n`;
          }
          msg += `Jami: *${overdue.length} ta* klient`;

          await bot.api.sendMessage(user.chatId, msg, {
            parse_mode: "Markdown",
          });
        } catch {
          // Foydalanuvchi botni bloklagan bo'lishi mumkin — e'tiborsiz o'tish
        }
      }
    },
    { timezone: "Asia/Tashkent" },
  );

  console.log("Scheduler ishga tushdi (har kuni 09:00 Toshkent)");
}
