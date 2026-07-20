import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const telegramUsersTable = pgTable("telegram_users", {
  id: serial("id").primaryKey(),
  chatId: text("chat_id").notNull().unique(),
  phone: text("phone").notNull(),
  responsiblePerson: text("responsible_person").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TelegramUser = typeof telegramUsersTable.$inferSelect;
export type InsertTelegramUser = typeof telegramUsersTable.$inferInsert;
