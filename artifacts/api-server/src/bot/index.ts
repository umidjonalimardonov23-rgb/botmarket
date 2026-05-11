import { Telegraf, Markup, Context } from "telegraf";
import { message } from "telegraf/filters";
import {
  getOrCreateUser,
  getUserByTelegramId,
  createOrder,
  getUserOrders,
  getStats,
  getAllPendingOrders,
  updateOrderStatus,
  getUserByReferralCode,
  initDb,
} from "./database.js";
import { BOT_CATALOG, getBotById, formatPrice } from "./data.js";
import { logger } from "../lib/logger.js";

const BOT_TOKEN = process.env["BOT_TOKEN"];
const ADMIN_ID = process.env["ADMIN_ID"] || "7575930751";
const MINI_APP_URL = process.env["MINI_APP_URL"] || "https://uzbot-market.up.railway.app/miniapp";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN environment variable is required");
}

export const bot = new Telegraf(BOT_TOKEN);

function isAdmin(ctx: Context): boolean {
  return String(ctx.from?.id) === ADMIN_ID;
}

function mainKeyboard(isAdminUser: boolean) {
  const buttons = [
    [Markup.button.webApp("🛍 Botlar Do'koni", MINI_APP_URL)],
    [Markup.button.text("📦 Buyurtmalarim"), Markup.button.text("👤 Profilim")],
    [Markup.button.text("💬 Bog'lanish"), Markup.button.text("ℹ️ Narxlar")],
  ];
  if (isAdminUser) {
    buttons.push([Markup.button.text("🔧 Admin Panel")]);
  }
  return Markup.keyboard(buttons).resize();
}

bot.start(async (ctx) => {
  try {
    const startPayload = ctx.startPayload;
    let referredBy: string | undefined;
    if (startPayload?.startsWith("ref_")) {
      const code = startPayload.replace("ref_", "");
      const referrer = await getUserByReferralCode(code);
      if (referrer && String(referrer.telegram_id) !== String(ctx.from.id)) {
        referredBy = code;
      }
    }

    await getOrCreateUser(String(ctx.from.id), ctx.from.username, ctx.from.first_name, referredBy);

    const adminUser = isAdmin(ctx);
    try {
      await ctx.replyWithPhoto(
        { url: "https://i.imgur.com/8c2VXPD.png" },
        {
          caption:
            `🤖 *UzBOT Market ga xush kelibsiz!*\n\n` +
            `Assalomu alaykum, *${ctx.from.first_name}*! 👋\n\n` +
            `Biz Telegram botlarini yaratib, serverga joylaymiz.\n\n` +
            `💎 *Bizning xizmatlarimiz:*\n` +
            `• 10+ turdagi tayyor botlar\n` +
            `• Professional dizayn\n` +
            `• 7/24 texnik yordam\n` +
            `• Arzon narxlar — 50,000 so'mdan\n\n` +
            `👇 Quyidagi menyudan tanlang:`,
          parse_mode: "Markdown",
          ...mainKeyboard(adminUser),
        }
      );
    } catch {
      await ctx.reply(
        `🤖 *UzBOT Market ga xush kelibsiz!*\n\nAssalomu alaykum, *${ctx.from.first_name}*! 👋\n\n💎 10+ turdagi tayyor botlar arzon narxlarda!\n\n👇 Quyidagi menyudan tanlang:`,
        { parse_mode: "Markdown", ...mainKeyboard(adminUser) }
      );
    }
  } catch (err) {
    logger.error({ err }, "Start command error");
    await ctx.reply("Xush kelibsiz! Bot ishga tushdi. 🤖", mainKeyboard(isAdmin(ctx)));
  }
});

bot.hears("📦 Buyurtmalarim", async (ctx) => {
  const orders = await getUserOrders(String(ctx.from.id));
  if (orders.length === 0) {
    await ctx.reply(
      "📦 Sizda hali buyurtmalar yo'q.\n\n🛍 Botlar Do'koniga kiring va birinchi buyurtmangizni bering!",
      mainKeyboard(isAdmin(ctx))
    );
    return;
  }

  const statusEmoji: Record<string, string> = {
    pending: "⏳",
    completed: "✅",
    cancelled: "❌",
    processing: "🔄",
  };

  let text = "📦 *Buyurtmalaringiz:*\n\n";
  for (const order of orders) {
    const date = new Date(Number(order.created_at) * 1000).toLocaleDateString("uz-UZ");
    const statusLabel = order.status === "pending" ? "Kutilmoqda" : order.status === "completed" ? "Bajarildi" : order.status === "cancelled" ? "Bekor qilindi" : "Jarayonda";
    text += `${statusEmoji[order.status] || "📋"} *${order.bot_name}*\n`;
    text += `   💰 ${formatPrice(order.price)}\n`;
    text += `   📅 ${date}\n`;
    text += `   📌 Holat: ${statusLabel}\n\n`;
  }

  await ctx.reply(text, { parse_mode: "Markdown", ...mainKeyboard(isAdmin(ctx)) });
});

bot.hears("👤 Profilim", async (ctx) => {
  const user = await getUserByTelegramId(String(ctx.from.id));
  if (!user) {
    await ctx.reply("Profilingiz topilmadi. /start bosing.");
    return;
  }

  const orders = await getUserOrders(String(ctx.from.id));
  const botUsername = ctx.botInfo?.username || "UzBOTpro_bot";
  const refLink = `https://t.me/${botUsername}?start=ref_${user.referral_code}`;
  const joinDate = new Date(Number(user.created_at) * 1000).toLocaleDateString("uz-UZ");

  const text =
    `👤 *Profilingiz*\n\n` +
    `📛 Ism: ${ctx.from.first_name}\n` +
    `🆔 ID: \`${ctx.from.id}\`\n` +
    `📅 Ro'yxatdan o'tgan: ${joinDate}\n` +
    `📦 Buyurtmalar soni: ${orders.length}\n\n` +
    `🔗 *Referral havolangiz:*\n` +
    `\`${refLink}\`\n\n` +
    `Do'stlaringizni taklif qiling! 🎁`;

  await ctx.reply(text, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.url("📤 Ulashish", `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=UzBOT Market orqali professional Telegram bot yaratting!`)],
    ]),
  });
});

bot.hears("💬 Bog'lanish", async (ctx) => {
  await ctx.reply(
    "📞 *Biz bilan bog'laning:*\n\n" +
    "👨‍💼 Admin: @akaakayev8\n" +
    "⏰ Ish vaqti: 09:00 - 22:00\n" +
    "📍 Toshkent, O'zbekiston\n\n" +
    "Savollaringiz bo'lsa, adminga yozing! 😊",
    { parse_mode: "Markdown", ...mainKeyboard(isAdmin(ctx)) }
  );
});

bot.hears("ℹ️ Narxlar", async (ctx) => {
  let text = "💰 *Narxlar ro'yxati:*\n\n";
  for (const b of BOT_CATALOG) {
    text += `${b.emoji} *${b.name}*\n`;
    text += `   💵 ${formatPrice(b.price)}\n\n`;
  }
  text += "📌 Barcha botlar uchun 1 hafta bepul sinov!\n";
  text += "🔔 Muddati tugashidan 7 kun oldin xabar beriladi.";
  await ctx.reply(text, { parse_mode: "Markdown", ...mainKeyboard(isAdmin(ctx)) });
});

bot.hears("🔧 Admin Panel", async (ctx) => {
  if (!isAdmin(ctx)) return;

  const stats = await getStats();
  const text =
    `🔧 *Admin Panel*\n\n` +
    `👥 Jami foydalanuvchilar: *${stats.totalUsers}*\n` +
    `📦 Jami buyurtmalar: *${stats.totalOrders}*\n` +
    `⏳ Kutilayotgan: *${stats.pendingOrders}*\n` +
    `✅ Bajarilgan: *${stats.completedOrders}*\n` +
    `💰 Jami daromad: *${stats.totalRevenue.toLocaleString()} so'm*`;

  await ctx.reply(text, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("📋 Kutilayotgan buyurtmalar", "admin_pending")],
    ]),
  });
});

bot.action("admin_pending", async (ctx) => {
  if (!isAdmin(ctx)) return;
  const orders = await getAllPendingOrders();
  if (orders.length === 0) {
    await ctx.answerCbQuery("Kutilayotgan buyurtmalar yo'q");
    return;
  }

  for (const order of orders.slice(0, 5)) {
    const date = new Date(Number(order.created_at) * 1000).toLocaleString("uz-UZ");
    await ctx.reply(
      `📋 *Yangi buyurtma #${order.id}*\n\n` +
      `🤖 Bot: ${order.bot_name}\n` +
      `👤 Foydalanuvchi ID: ${order.user_id}\n` +
      `📞 Kontakt: ${order.contact}\n` +
      `💬 Izoh: ${order.note || "—"}\n` +
      `💰 Narx: ${formatPrice(order.price)}\n` +
      `📅 Sana: ${date}`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("✅ Qabul qilish", `approve_${order.id}`),
            Markup.button.callback("❌ Bekor qilish", `cancel_${order.id}`),
          ],
        ]),
      }
    );
  }
  await ctx.answerCbQuery();
});

bot.action(/^approve_(\d+)$/, async (ctx) => {
  if (!isAdmin(ctx)) return;
  const orderId = parseInt(ctx.match[1]);
  await updateOrderStatus(orderId, "completed");
  await ctx.editMessageText(`✅ Buyurtma #${orderId} qabul qilindi!`);
  await ctx.answerCbQuery("Buyurtma qabul qilindi!");
});

bot.action(/^cancel_(\d+)$/, async (ctx) => {
  if (!isAdmin(ctx)) return;
  const orderId = parseInt(ctx.match[1]);
  await updateOrderStatus(orderId, "cancelled");
  await ctx.editMessageText(`❌ Buyurtma #${orderId} bekor qilindi.`);
  await ctx.answerCbQuery("Bekor qilindi");
});

export async function sendOrderToAdmin(
  orderId: number,
  userId: string,
  botName: string,
  botEmoji: string,
  price: number,
  contact: string,
  note: string,
  userFirstName: string
) {
  try {
    const text =
      `🔔 *Yangi buyurtma keldi! #${orderId}*\n\n` +
      `${botEmoji} Bot: *${botName}*\n` +
      `👤 Mijoz: ${userFirstName} (ID: ${userId})\n` +
      `📞 Kontakt: ${contact}\n` +
      `💬 Izoh: ${note || "—"}\n` +
      `💰 Narx: ${formatPrice(price)}\n` +
      `📅 Sana: ${new Date().toLocaleString("uz-UZ")}`;

    await bot.telegram.sendMessage(ADMIN_ID, text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ Qabul qilish", `approve_${orderId}`),
          Markup.button.callback("❌ Bekor qilish", `cancel_${orderId}`),
        ],
      ]),
    });
  } catch (err) {
    logger.error({ err }, "Failed to send order to admin");
  }
}

bot.on(message("text"), async (ctx) => {
  await ctx.reply(
    "Buyruqni tushunmadim. Iltimos, quyidagi menyudan foydalaning 👇",
    mainKeyboard(isAdmin(ctx))
  );
});

bot.catch((err) => {
  logger.error({ err }, "Bot error");
});

export async function startBot() {
  logger.info("Starting Telegram bot...");
  await initDb();
  bot.launch({ dropPendingUpdates: true });
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
  logger.info("Bot started successfully");
}
