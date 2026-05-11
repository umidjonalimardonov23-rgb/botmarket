import { Telegraf, Markup } from "telegraf";
import { db } from "@workspace/db";
import { telegramUsersTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const MINI_APP_URL = process.env.MINI_APP_URL || "https://botmarket.replit.app";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN environment variable is required");
}

export const bot = new Telegraf(BOT_TOKEN);

function generateRefCode(telegramId: string): string {
  return `ref_${telegramId}_${Date.now().toString(36)}`;
}

async function getOrCreateUser(ctx: any) {
  const tgUser = ctx.from;
  if (!tgUser) return null;

  const telegramId = String(tgUser.id);
  const [existing] = await db
    .select()
    .from(telegramUsersTable)
    .where(eq(telegramUsersTable.telegramId, telegramId));

  if (existing) return existing;

  const refCode = generateRefCode(telegramId);
  const [created] = await db.insert(telegramUsersTable).values({
    telegramId,
    username: tgUser.username ?? null,
    firstName: tgUser.first_name ?? null,
    lastName: tgUser.last_name ?? null,
    referralCode: refCode,
    referredBy: null,
  }).returning();

  return created;
}

export async function sendAdminNotification(message: string) {
  if (!ADMIN_ID) return;
  try {
    await bot.telegram.sendMessage(ADMIN_ID, message, { parse_mode: "Markdown" });
  } catch (err) {
    logger.warn({ err }, "Failed to send admin notification");
  }
}

// /start command
bot.start(async (ctx) => {
  const payload = ctx.startPayload;
  const tgUser = ctx.from;
  const telegramId = String(tgUser.id);

  let referredBy: string | null = null;
  if (payload && payload.startsWith("ref_")) {
    referredBy = payload;
  }

  // Get or create user
  const [existing] = await db
    .select()
    .from(telegramUsersTable)
    .where(eq(telegramUsersTable.telegramId, telegramId));

  if (!existing) {
    const refCode = generateRefCode(telegramId);
    await db.insert(telegramUsersTable).values({
      telegramId,
      username: tgUser.username ?? null,
      firstName: tgUser.first_name ?? null,
      lastName: tgUser.last_name ?? null,
      referralCode: refCode,
      referredBy,
    });
  }

  const name = tgUser.first_name || "Do'stim";

  await ctx.replyWithPhoto(
    { url: "https://i.imgur.com/2nCt3Sbl.jpg" },
    {
      caption:
        `🤖 *BotMarket ga xush kelibsiz, ${name}!*\n\n` +
        `Bizda siz uchun har turdagi professional Telegram botlarini buyurtma qiling!\n\n` +
        `✅ *1 ta bot bepul* (1 hafta)\n` +
        `💰 Server narxi: oyiga *50,000 so'm*\n` +
        `🚀 24 soat ichida tayyor\n` +
        `🔒 Kafolat bilan\n\n` +
        `Quyidagi tugmani bosing 👇`,
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.webApp("🛍️ Botlarni Ko'rish", MINI_APP_URL)],
        [Markup.button.callback("📋 Mening Buyurtmalarim", "my_orders")],
        [Markup.button.callback("🔗 Referal Havola", "referral")],
        [Markup.button.callback("💳 To'lov Ma'lumoti", "payment_info")],
        [Markup.button.callback("📞 Bog'lanish", "contact")],
      ]),
    }
  );
});

// My orders
bot.action("my_orders", async (ctx) => {
  await ctx.answerCbQuery();
  const telegramId = String(ctx.from.id);

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.telegramId, telegramId));

  if (orders.length === 0) {
    return ctx.reply(
      "📭 *Sizda hozircha buyurtmalar yo'q*\n\nBot buyurtma qilish uchun pastdagi tugmani bosing:",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.webApp("🛍️ Bot Tanlash", MINI_APP_URL)],
        ]),
      }
    );
  }

  const statusEmoji: Record<string, string> = {
    pending: "⏳",
    confirmed: "✅",
    in_progress: "🔄",
    completed: "🎉",
    cancelled: "❌",
  };

  const statusText: Record<string, string> = {
    pending: "Kutilmoqda",
    confirmed: "Tasdiqlandi",
    in_progress: "Bajarilmoqda",
    completed: "Tayyor",
    cancelled: "Bekor qilindi",
  };

  let text = `📋 *Sizning buyurtmalaringiz (${orders.length} ta):*\n\n`;
  for (const order of orders.slice(0, 10)) {
    text += `${statusEmoji[order.status] ?? "❓"} *${order.botTypeName}*\n`;
    text += `   💰 ${order.totalPrice.toLocaleString()} so'm\n`;
    text += `   📅 ${new Date(order.createdAt).toLocaleDateString("uz-UZ")}\n`;
    text += `   Holat: ${statusText[order.status] ?? order.status}\n\n`;
  }

  await ctx.reply(text, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.webApp("🛍️ Yangi Bot", MINI_APP_URL)],
      [Markup.button.callback("🏠 Bosh Sahifa", "home")],
    ]),
  });
});

// Referral
bot.action("referral", async (ctx) => {
  await ctx.answerCbQuery();
  const telegramId = String(ctx.from.id);
  const [user] = await db
    .select()
    .from(telegramUsersTable)
    .where(eq(telegramUsersTable.telegramId, telegramId));

  if (!user) return ctx.reply("Xatolik yuz berdi. /start buyrug'ini qayta yuboring.");

  const referrals = await db
    .select()
    .from(telegramUsersTable)
    .where(eq(telegramUsersTable.referredBy, user.referralCode));

  const refLink = `https://t.me/botmarket_uz_bot?start=${user.referralCode}`;

  await ctx.reply(
    `🔗 *Sizning referal havolangiz:*\n\n` +
    `\`${refLink}\`\n\n` +
    `👥 Taklif qilganlar: *${referrals.length} kishi*\n\n` +
    `*Referal dasturi qoidalari:*\n` +
    `• Har bir do'stingiz uchun sovg'a\n` +
    `• Do'stingiz 1 hafta bepul bot oladi\n` +
    `• Sizga chegirma beriladi\n\n` +
    `Havolani nusxalab do'stlaringizga yuboring! 👆`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.url("📤 Do'stlarga Yuborish", `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent("BotMarket — professional Telegram botlar!")}`)]
      ]),
    }
  );
});

// Payment info
bot.action("payment_info", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    `💳 *To'lov Ma'lumoti*\n\n` +
    `*Karta raqami:*\n` +
    `\`9860 6067 6080 6673\`\n\n` +
    `*Egasi:*\n` +
    `Alimardonov Umidjon\n\n` +
    `*Server narxi:* 50,000 so'm/oy\n\n` +
    `📌 *To'lov qilgandan keyin:*\n` +
    `1. Chekni saqlang\n` +
    `2. @botmarket_uz_support ga yuboring\n` +
    `3. 30 daqiqa ichida faollashtiriladi\n\n` +
    `⚠️ *Muhim:* To'lov izohiga Telegram usernamingizni yozing`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🏠 Bosh Sahifa", "home")],
      ]),
    }
  );
});

// Contact
bot.action("contact", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    `📞 *Bog'lanish*\n\n` +
    `👨‍💼 Admin: @botmarket_admin\n` +
    `🕐 Ish vaqti: 9:00 - 22:00\n` +
    `📧 Murojaat: Telegram orqali\n\n` +
    `Savollaringiz bo'lsa, bemalol yozing!`,
    { parse_mode: "Markdown" }
  );
});

// Home
bot.action("home", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    `🏠 *Bosh Sahifa*`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.webApp("🛍️ Botlarni Ko'rish", MINI_APP_URL)],
        [Markup.button.callback("📋 Mening Buyurtmalarim", "my_orders")],
        [Markup.button.callback("🔗 Referal Havola", "referral")],
        [Markup.button.callback("💳 To'lov Ma'lumoti", "payment_info")],
      ]),
    }
  );
});

// Admin: /admin command
bot.command("admin", async (ctx) => {
  if (String(ctx.from.id) !== ADMIN_ID) {
    return ctx.reply("❌ Ruxsat yo'q");
  }

  const allOrders = await db.select().from(ordersTable);
  const pending = allOrders.filter(o => o.status === "pending").length;
  const completed = allOrders.filter(o => o.status === "completed").length;
  const totalRevenue = allOrders
    .filter(o => o.status === "completed")
    .reduce((s, o) => s + o.totalPrice, 0);

  const userCount = await db.select().from(telegramUsersTable);

  await ctx.reply(
    `📊 *Admin Panel*\n\n` +
    `👥 Foydalanuvchilar: ${userCount.length}\n` +
    `📦 Jami buyurtmalar: ${allOrders.length}\n` +
    `⏳ Kutayotgan: ${pending}\n` +
    `✅ Bajarilgan: ${completed}\n` +
    `💰 Jami daromad: ${totalRevenue.toLocaleString()} so'm\n\n` +
    `*So'nggi 5 buyurtma:*\n`,
    { parse_mode: "Markdown" }
  );

  const recent = allOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  for (const o of recent) {
    await ctx.reply(
      `#${o.id} — ${o.botTypeName}\n` +
      `👤 ${o.clientName} | 📞 ${o.clientPhone}\n` +
      `💰 ${o.totalPrice.toLocaleString()} so'm | ${o.status}`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ Tasdiqlash", `confirm_${o.id}`),
          Markup.button.callback("🔄 Jarayonda", `progress_${o.id}`),
        ],
        [
          Markup.button.callback("🎉 Tayyor", `complete_${o.id}`),
          Markup.button.callback("❌ Bekor", `cancel_${o.id}`),
        ],
      ])
    );
  }
});

// Admin order status actions
const statusActions: Record<string, string> = {
  confirm: "confirmed",
  progress: "in_progress",
  complete: "completed",
  cancel: "cancelled",
};

for (const [action, status] of Object.entries(statusActions)) {
  bot.action(new RegExp(`^${action}_(\\d+)$`), async (ctx) => {
    if (String(ctx.from.id) !== ADMIN_ID) {
      return ctx.answerCbQuery("Ruxsat yo'q");
    }
    await ctx.answerCbQuery();
    const match = ctx.match as RegExpMatchArray;
    const orderId = parseInt(match[1]);

    const [updated] = await db
      .update(ordersTable)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(ordersTable.id, orderId))
      .returning();

    if (!updated) return ctx.reply("Buyurtma topilmadi");

    await ctx.reply(`✅ Buyurtma #${orderId} holati: *${status}*`, { parse_mode: "Markdown" });

    const statusMessages: Record<string, string> = {
      confirmed: `✅ *Buyurtmangiz tasdiqlandi!*\n\nBot ID: #${orderId}\nBot: ${updated.botTypeName}\n\nTez orada aloqaga chiqamiz!`,
      in_progress: `🔄 *Botingiz yaratilmoqda!*\n\nBot ID: #${orderId}\n24 soat ichida tayyor bo'ladi.`,
      completed: `🎉 *Botingiz tayyor!*\n\nBot ID: #${orderId}\nBot: ${updated.botTypeName}\n\nAdmin siz bilan bog'lanadi. Rahmat!`,
      cancelled: `❌ *Buyurtmangiz bekor qilindi*\n\nBot ID: #${orderId}\n\nSavollar uchun: @botmarket_admin`,
    };

    if (statusMessages[status]) {
      try {
        await bot.telegram.sendMessage(updated.telegramId, statusMessages[status], { parse_mode: "Markdown" });
      } catch {}
    }
  });
}

// Weekly trial expiry reminder (called externally via cron)
export async function checkTrialExpiry() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const users = await db
    .select()
    .from(telegramUsersTable)
    .where(eq(telegramUsersTable.trialStartedAt, oneWeekAgo));

  // In production, use proper date comparison
  // This is a placeholder — the cron job will handle this
}

export async function sendTrialExpiryReminders() {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const allUsers = await db.select().from(telegramUsersTable);

    for (const user of allUsers) {
      if (
        user.trialStartedAt &&
        new Date(user.trialStartedAt) <= oneWeekAgo
      ) {
        try {
          await bot.telegram.sendMessage(
            user.telegramId,
            `⏰ *Bepul sinov muddati tugadi!*\n\n` +
            `Botingiz 1 haftalik bepul davri tugadi.\n\n` +
            `🔄 *Botni davom ettirish uchun:*\n` +
            `Server to'lovi: *50,000 so'm/oy*\n\n` +
            `💳 *Karta:* \`9860 6067 6080 6673\`\n` +
            `👤 *Egasi:* Alimardonov Umidjon\n\n` +
            `To'lovdan keyin chekni @botmarket_admin ga yuboring.\n` +
            `✅ 30 daqiqa ichida faollashtiriladi!`,
            {
              parse_mode: "Markdown",
              ...Markup.inlineKeyboard([
                [Markup.button.callback("💳 To'lov Ma'lumoti", "payment_info")],
              ]),
            }
          );
        } catch (err) {
          logger.warn({ err, telegramId: user.telegramId }, "Failed to send trial expiry message");
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "Failed to check trial expiry");
  }
}

export function startBot() {
  bot.launch({
    dropPendingUpdates: true,
  });
  logger.info("Telegram bot started (polling)");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}
