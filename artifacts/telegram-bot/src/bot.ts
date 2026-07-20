import { Bot, Keyboard } from "grammy";
import {
  getRegisteredUser,
  registerUser,
  getClientsWithDebt,
  getOverdueClients,
  getResponsiblePersonNames,
  type ClientDebt,
} from "./db.js";

type Step = "idle" | "ask_phone" | "ask_name";

interface UserState {
  step: Step;
  phone?: string;
}

const states = new Map<number, UserState>();

const mainKeyboard = new Keyboard()
  .text("📋 Mening klientlarim")
  .text("⚠️ Muddati o'tgan (>10 kun)")
  .resized();

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(amount));
}

function buildClientList(title: string, clients: ClientDebt[]): string {
  let msg = `${title} *(${clients.length} ta):*\n\n`;
  for (const c of clients) {
    msg += `👤 *${c.name}*`;
    if (c.territory) msg += ` — ${c.territory}`;
    msg += `\n💰 Qarz: *${formatAmount(c.debt)} so'm*\n`;
    msg += `📅 So'nggi amal: ${c.daysSince === 9999 ? "hech qachon" : `${c.daysSince} kun oldin`}\n\n`;
  }
  return msg.trim();
}

export function createBot(token: string): Bot {
  const bot = new Bot(token);

  // /start
  bot.command("start", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const user = await getRegisteredUser(chatId);
    if (user) {
      await ctx.reply(
        `Xush kelibsiz, *${user.responsiblePerson}!* 👋\nQuyidagi tugmalardan foydalaning:`,
        { parse_mode: "Markdown", reply_markup: mainKeyboard },
      );
    } else {
      states.set(ctx.chat.id, { step: "ask_phone" });
      await ctx.reply(
        "Salom! 👋\nIltimos, telefon raqamingizni yuboring.\n*Masalan:* \\+998901234567",
        { parse_mode: "MarkdownV2" },
      );
    }
  });

  // Matn xabarlari
  bot.on("message:text", async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text.trim();
    const state = states.get(chatId) ?? { step: "idle" };

    // ── 1. Telefon raqam bosqichi ─────────────────────────────────────
    if (state.step === "ask_phone") {
      const cleaned = text.replace(/[\s\-()]/g, "");
      if (!/^\+?[0-9]{9,15}$/.test(cleaned)) {
        await ctx.reply(
          "❌ Noto'g'ri format. Iltimos qaytadan yuboring.\n*Masalan:* +998901234567",
          { parse_mode: "Markdown" },
        );
        return;
      }
      states.set(chatId, { step: "ask_name", phone: cleaned });
      await ctx.reply(
        "✅ Telefon qabul qilindi.\n\nEndi tizimda siz uchun ko'rsatilgan *to'liq ismingizni* yuboring.\n_(Masalan: Abdullayev Jasur)_",
        { parse_mode: "Markdown" },
      );
      return;
    }

    // ── 2. Ism bosqichi ───────────────────────────────────────────────
    if (state.step === "ask_name") {
      const names = await getResponsiblePersonNames();
      const matched = names.find((n) => n.toLowerCase() === text.toLowerCase());
      if (!matched) {
        await ctx.reply(
          `❌ *"${text}"* tizimda topilmadi.\n\nIltimos, tizimda qanday ism bilan mavjud ekanligingizni tekshirib qaytadan yuboring.`,
          { parse_mode: "Markdown" },
        );
        return;
      }
      await registerUser(chatId.toString(), state.phone!, matched);
      states.delete(chatId);
      await ctx.reply(
        `✅ Muvaffaqiyatli ro'yxatdan o'tdingiz!\n\nXush kelibsiz, *${matched}* 🎉`,
        { parse_mode: "Markdown", reply_markup: mainKeyboard },
      );
      return;
    }

    // ── 3. Asosiy menyu ───────────────────────────────────────────────
    const user = await getRegisteredUser(chatId.toString());
    if (!user) {
      await ctx.reply(
        "Iltimos, avval /start buyrug'ini yuboring.",
      );
      return;
    }

    if (text === "📋 Mening klientlarim") {
      await ctx.replyWithChatAction("typing");
      const clients = await getClientsWithDebt(user.responsiblePerson);
      if (clients.length === 0) {
        await ctx.reply(
          "✅ Hozircha qarzli klientlar yo'q.",
          { reply_markup: mainKeyboard },
        );
        return;
      }
      const msg = buildClientList("📋 *Sizning qarzli klientlaringiz*", clients);
      await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: mainKeyboard });
      return;
    }

    if (text === "⚠️ Muddati o'tgan (>10 kun)") {
      await ctx.replyWithChatAction("typing");
      const clients = await getOverdueClients(user.responsiblePerson, 10);
      if (clients.length === 0) {
        await ctx.reply(
          "✅ 10 kundan oshgan qarz yo'q — hammasi yaxshi!",
          { reply_markup: mainKeyboard },
        );
        return;
      }
      const msg = buildClientList("⚠️ *Muddati o'tgan qarzlar (>10 kun)*", clients);
      await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: mainKeyboard });
      return;
    }

    // Noma'lum xabar
    await ctx.reply(
      "Quyidagi tugmalardan foydalaning 👇",
      { reply_markup: mainKeyboard },
    );
  });

  bot.catch((err) => {
    console.error("Bot xatosi:", err.message);
  });

  return bot;
}
