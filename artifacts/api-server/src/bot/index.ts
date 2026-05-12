import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { logger } from "../lib/logger.js";
import { BOT_CATALOG, formatPrice, getBotById } from "./catalog.js";
import {
  createUser,
  createOrder,
  getUser,
  getUserOrders,
  isTrialActive,
  trialDaysLeft,
  upsertUser,
} from "./storage.js";

const BOT_TOKEN = process.env["BOT_TOKEN"];
const ADMIN_ID = Number(process.env["ADMIN_ID"] || "7575930751");
const PAYMENT_CARD = process.env["PAYMENT_CARD"] || "9860606760806673";
const PAYMENT_NAME = process.env["PAYMENT_NAME"] || "Alimardonov Umidjon";

const REPLIT_DOMAIN = process.env["REPLIT_DEV_DOMAIN"] || process.env["REPLIT_DOMAINS"]?.split(",")[0];
const MINI_APP_URL = process.env["MINI_APP_URL"] ||
  (REPLIT_DOMAIN ? `https://${REPLIT_DOMAIN}/api/miniapp` : "");

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is required");

export const bot = new Bot(BOT_TOKEN);

bot.catch((err) => {
  logger.error({ err: err.message, method: (err.error as any)?.method }, "Bot error");
});

const pendingOrders = new Map<number, { botId: string; step: string }>();

function mainKeyboard(_userId: number) {
  const kb = new InlineKeyboard();
  if (MINI_APP_URL) {
    kb.webApp("🛍 Botlar Do'koni", MINI_APP_URL).row();
  }
  kb.text("🤖 Katalog", "catalog")
    .text("📦 Buyurtmalarim", "my_orders")
    .row()
    .text("👥 Referral", "referral")
    .text("💳 Obuna", "subscription")
    .row()
    .text("📞 Aloqa", "contact")
    .text("ℹ️ Haqida", "about");
  return kb;
}

function statusEmoji(status: string) {
  return { pending: "⏳", confirmed: "✅", done: "🎉", cancelled: "❌" }[status] ?? "❓";
}

bot.command("start", async (ctx) => {
  const userId = ctx.from!.id;
  const firstName = ctx.from!.first_name;
  const username = ctx.from?.username;
  const args = ctx.match;
  let refBy: number | undefined;
  if (args && args.startsWith("ref_")) {
    refBy = Number(args.replace("ref_", ""));
    if (refBy === userId) refBy = undefined;
  }
  const user = createUser(userId, firstName, username, refBy);

  if (refBy && refBy !== userId) {
    try {
      await bot.api.sendMessage(
        refBy,
        `🎉 Yangi referral! <b>${firstName}</b> sizning havolangiz orqali qo'shildi!`,
        { parse_mode: "HTML" }
      );
    } catch {}
  }

  const daysLeft = trialDaysLeft(user);
  const trialText = isTrialActive(user)
    ? `✅ Sinov muddati: <b>${daysLeft} kun</b> qoldi`
    : `⚠️ Sinov muddati tugagan`;

  await ctx.reply(
    `👋 Xush kelibsiz, <b>${firstName}</b>!\n\n` +
      `🤖 <b>BotMarket</b> — professional Telegram botlar do'koni\n\n` +
      `📋 Bizda <b>10+ turdagi</b> bot mavjud\n` +
      `💰 Narxlar: <b>50,000 so'mdan</b> boshlanadi\n` +
      `🎁 Birinchi bot — <b>1 hafta bepul!</b>\n\n` +
      `${trialText}\n\n` +
      `👇 Quyidagi menyudan tanlang:`,
    {
      parse_mode: "HTML",
      reply_markup: mainKeyboard(userId),
    }
  );
});

bot.command("admin", async (ctx) => {
  if (ctx.from!.id !== ADMIN_ID) return;
  const { getAllUsers, getAllOrders } = await import("./storage.js");
  const users = getAllUsers();
  const orders = getAllOrders().slice(0, 5);
  const pending = orders.filter((o) => o.status === "pending").length;
  await ctx.reply(
    `📊 <b>Admin Panel</b>\n\n` +
      `👤 Foydalanuvchilar: <b>${users.length}</b>\n` +
      `📦 Jami buyurtmalar: <b>${getAllOrders().length}</b>\n` +
      `⏳ Kutilayotgan: <b>${pending}</b>\n\n` +
      `So'nggi buyurtmalar:\n` +
      orders
        .map(
          (o) =>
            `${statusEmoji(o.status)} #${o.id} — ${o.botName} — ${o.userFirstName}`
        )
        .join("\n"),
    { parse_mode: "HTML" }
  );
});

bot.callbackQuery("catalog", async (ctx) => {
  await ctx.answerCallbackQuery();
  const kb = new InlineKeyboard();
  BOT_CATALOG.forEach((bot, i) => {
    kb.text(`${bot.emoji} ${bot.name} — ${formatPrice(bot.price)}`, `bot_${bot.id}`);
    kb.row();
  });
  kb.text("🔙 Orqaga", "back_main");
  await ctx.editMessageText(
    `🤖 <b>Botlar Katalogi</b>\n\n` +
      `Quyidagi botlardan birini tanlang 👇`,
    { parse_mode: "HTML", reply_markup: kb }
  );
});

bot.callbackQuery(/^bot_(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const botId = ctx.match[1]!;
  const botType = getBotById(botId);
  if (!botType) return;
  const kb = new InlineKeyboard()
    .text("✅ Buyurtma berish", `order_${botId}`)
    .row()
    .text("🔙 Katalogga", "catalog");
  await ctx.editMessageText(
    `${botType.emoji} <b>${botType.name}</b>\n\n` +
      `📝 ${botType.desc}\n\n` +
      `✨ <b>Imkoniyatlar:</b>\n` +
      botType.features.map((f) => `  • ${f}`).join("\n") +
      `\n\n💰 <b>Narx: ${formatPrice(botType.price)}</b>\n\n` +
      `⏱ Bajarish muddati: 3-7 ish kuni`,
    { parse_mode: "HTML", reply_markup: kb }
  );
});

bot.callbackQuery(/^order_(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const botId = ctx.match[1]!;
  const botType = getBotById(botId);
  if (!botType) return;
  const userId = ctx.from.id;
  pendingOrders.set(userId, { botId, step: "requirements" });
  await ctx.editMessageText(
    `📝 <b>${botType.emoji} ${botType.name}</b> buyurtma\n\n` +
      `Iltimos, botingiz uchun talablarni yozing:\n` +
      `• Bot nima qilishi kerak?\n` +
      `• Qanday funksiyalar kerak?\n` +
      `• Qo'shimcha istaklaringiz?\n\n` +
      `💬 Xabar yuboring:`,
    { parse_mode: "HTML" }
  );
});

bot.callbackQuery("my_orders", async (ctx) => {
  await ctx.answerCallbackQuery();
  const orders = getUserOrders(ctx.from.id);
  if (orders.length === 0) {
    const kb = new InlineKeyboard().text("🤖 Katalog", "catalog").text("🔙 Orqaga", "back_main");
    await ctx.editMessageText(
      `📦 <b>Buyurtmalarim</b>\n\nHali buyurtma bermadingiz.\n\n🛍 Katalogdan bot tanlang!`,
      { parse_mode: "HTML", reply_markup: kb }
    );
    return;
  }
  const kb = new InlineKeyboard().text("🔙 Orqaga", "back_main");
  const text =
    `📦 <b>Buyurtmalarim</b> (${orders.length} ta)\n\n` +
    orders
      .map(
        (o) =>
          `${statusEmoji(o.status)} <b>${o.botName}</b>\n` +
          `   💰 ${formatPrice(o.price)}\n` +
          `   📅 ${new Date(o.createdAt).toLocaleDateString("uz-UZ")}\n` +
          `   🏷 ${o.id}`
      )
      .join("\n\n");
  await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
});

bot.callbackQuery("referral", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from.id;
  const user = getUser(userId) || createUser(userId, ctx.from.first_name, ctx.from.username);
  const botInfo = await bot.api.getMe();
  const refLink = `https://t.me/${botInfo.username}?start=ref_${userId}`;
  const kb = new InlineKeyboard().text("🔙 Orqaga", "back_main");
  await ctx.editMessageText(
    `👥 <b>Referral Tizimi</b>\n\n` +
      `🔗 Sizning havola:\n<code>${refLink}</code>\n\n` +
      `👤 Taklif qilganlaringiz: <b>${user.refs.length} kishi</b>\n\n` +
      `🎁 <b>Bonuslar:</b>\n` +
      `• Har bir referral uchun — maxsus chegirma\n` +
      `• 5+ referral — 1 oy bepul server\n` +
      `• 10+ referral — katta sovg'a!\n\n` +
      `💡 Havolani do'stlaringizga yuboring!`,
    { parse_mode: "HTML", reply_markup: kb }
  );
});

bot.callbackQuery("subscription", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from.id;
  const user = getUser(userId) || createUser(userId, ctx.from.first_name, ctx.from.username);
  const active = isTrialActive(user);
  const days = trialDaysLeft(user);
  const kb = new InlineKeyboard();
  if (!active) {
    kb.text("💳 To'lov qilish", "pay_subscription").row();
  }
  kb.text("🔙 Orqaga", "back_main");
  await ctx.editMessageText(
    `💳 <b>Obuna holati</b>\n\n` +
      (active
        ? `✅ <b>Faol</b> — ${days} kun qoldi\n\n⚡ Barcha xizmatlar ochiq!`
        : `❌ <b>Tugagan</b>\n\n` +
          `Botingiz to'xtatilmasligi uchun obunani yangilang.\n\n` +
          `💰 <b>Narx: 50,000 so'm/oy</b>\n` +
          `🏦 Karta: <code>${PAYMENT_CARD}</code>\n` +
          `👤 Ism: <b>${PAYMENT_NAME}</b>\n\n` +
          `To'lovdan so'ng @admin ga screenshot yuboring`) +
      `\n\n` +
      `📋 <b>Tarif:</b>\n` +
      `• 1 oy — 50,000 so'm\n` +
      `• 3 oy — 130,000 so'm\n` +
      `• 1 yil — 450,000 so'm`,
    { parse_mode: "HTML", reply_markup: kb }
  );
});

bot.callbackQuery("pay_subscription", async (ctx) => {
  await ctx.answerCallbackQuery();
  const kb = new InlineKeyboard().text("✅ To'ladim, tekshiring", "check_payment").row().text("🔙 Orqaga", "subscription");
  await ctx.editMessageText(
    `💳 <b>To'lov</b>\n\n` +
      `🏦 Karta raqami:\n<code>${PAYMENT_CARD}</code>\n\n` +
      `👤 Ism: <b>${PAYMENT_NAME}</b>\n` +
      `💰 Miqdor: <b>50,000 so'm</b>\n\n` +
      `📸 To'lov screenshot ini yuboring va "To'ladim" tugmasini bosing`,
    { parse_mode: "HTML", reply_markup: kb }
  );
});

bot.callbackQuery("check_payment", async (ctx) => {
  await ctx.answerCallbackQuery("Adminга yuborildi, tez orada tekshiriladi! ✅");
  await bot.api.sendMessage(
    ADMIN_ID,
    `💳 <b>To'lov tekshiruvi</b>\n\n` +
      `👤 Foydalanuvchi: <b>${ctx.from.first_name}</b>\n` +
      `🆔 ID: <code>${ctx.from.id}</code>\n` +
      `📱 Username: @${ctx.from.username || "yo'q"}\n\n` +
      `To'lovni tekshiring va tasdiqlang:`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard()
        .text("✅ Tasdiqlash", `confirm_pay_${ctx.from.id}`)
        .text("❌ Rad etish", `reject_pay_${ctx.from.id}`),
    }
  );
});

bot.callbackQuery(/^confirm_pay_(\d+)$/, async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) { await ctx.answerCallbackQuery("Ruxsat yo'q"); return; }
  const userId = Number(ctx.match[1]);
  const user = getUser(userId);
  if (user) {
    user.paidUntil = Date.now() + 30 * 24 * 60 * 60 * 1000;
    user.notified = false;
    upsertUser(user);
  }
  await ctx.answerCallbackQuery("✅ Tasdiqlandi!");
  const msgText = (ctx as any)?.callbackQuery?.message?.text as string | undefined;
  if (msgText) {
    await ctx.editMessageText(msgText + "\n\n✅ TASDIQLANDI", { parse_mode: "HTML" });
  }
  await bot.api.sendMessage(
    userId,
    `🎉 <b>Obuna faollashtirildi!</b>\n\n✅ 30 kunlik obuna boshlandi.\nBarcha xizmatlardan foydalaning!`,
    { parse_mode: "HTML" }
  );
});

bot.callbackQuery(/^reject_pay_(\d+)$/, async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) { await ctx.answerCallbackQuery("Ruxsat yo'q"); return; }
  const userId = Number(ctx.match[1]);
  await ctx.answerCallbackQuery("❌ Rad etildi");
  const msgText = (ctx as any)?.callbackQuery?.message?.text as string | undefined;
  if (msgText) {
    await ctx.editMessageText(msgText + "\n\n❌ RAD ETILDI", { parse_mode: "HTML" });
  }
  await bot.api.sendMessage(
    userId,
    `❌ <b>To'lov tasdiqlanmadi</b>\n\nIltimos, to'g'ri miqdorda to'lab, screenshot yuboring.\n\n🏦 Karta: <code>${PAYMENT_CARD}</code>`,
    { parse_mode: "HTML" }
  );
});

bot.callbackQuery("contact", async (ctx) => {
  await ctx.answerCallbackQuery();
  const kb = new InlineKeyboard().url("💬 Admin bilan bog'lanish", "https://t.me/admin").row().text("🔙 Orqaga", "back_main");
  await ctx.editMessageText(
    `📞 <b>Aloqa</b>\n\n` +
      `👨‍💻 Admin: @admin\n` +
      `⏰ Ish vaqti: 09:00 — 22:00\n` +
      `📩 Javob muddati: 1-2 soat\n\n` +
      `❓ Savollaringiz bo'lsa, adminга yozing!`,
    { parse_mode: "HTML", reply_markup: kb }
  );
});

bot.callbackQuery("about", async (ctx) => {
  await ctx.answerCallbackQuery();
  const kb = new InlineKeyboard().text("🔙 Orqaga", "back_main");
  await ctx.editMessageText(
    `ℹ️ <b>BotMarket haqida</b>\n\n` +
      `🤖 Professional Telegram botlar yaratish xizmati\n\n` +
      `✅ <b>Afzalliklar:</b>\n` +
      `• 10+ turdagi tayyor bot\n` +
      `• Narxlar: 50,000 so'mdan\n` +
      `• Bajarish: 3-7 ish kuni\n` +
      `• 1 hafta bepul sinov\n` +
      `• 24/7 texnik qo'llab-quvvatlash\n\n` +
      `💡 Botingizni buyurtma bering va biznesingizni avtomatlashiring!`,
    { parse_mode: "HTML", reply_markup: kb }
  );
});

bot.callbackQuery("back_main", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from.id;
  const user = getUser(userId) || createUser(userId, ctx.from.first_name, ctx.from.username);
  const days = trialDaysLeft(user);
  const trialText = isTrialActive(user)
    ? `✅ Sinov muddati: <b>${days} kun</b> qoldi`
    : `⚠️ Sinov muddati tugagan — <b>obunani yangilang</b>`;
  await ctx.editMessageText(
    `🏠 <b>Asosiy Menyu</b>\n\n${trialText}\n\nNimani xohlaysiz? 👇`,
    { parse_mode: "HTML", reply_markup: mainKeyboard(userId) }
  );
});

bot.on("message:text", async (ctx) => {
  const userId = ctx.from.id;
  const pending = pendingOrders.get(userId);
  if (!pending) return;

  if (pending.step === "requirements") {
    const botType = getBotById(pending.botId);
    if (!botType) return;
    const requirements = ctx.message.text;

    const order = createOrder({
      userId,
      userFirstName: ctx.from.first_name,
      username: ctx.from.username,
      botType: botType.id,
      botName: `${botType.emoji} ${botType.name}`,
      requirements,
      status: "pending",
      price: botType.price,
    });

    pendingOrders.delete(userId);

    await ctx.reply(
      `✅ <b>Buyurtma qabul qilindi!</b>\n\n` +
        `📋 Bot: <b>${botType.emoji} ${botType.name}</b>\n` +
        `💰 Narx: <b>${formatPrice(botType.price)}</b>\n` +
        `🏷 ID: <code>${order.id}</code>\n\n` +
        `${
          botType.price > 0
            ? `💳 <b>To'lov:</b>\n🏦 Karta: <code>${PAYMENT_CARD}</code>\n👤 Ism: ${PAYMENT_NAME}\n\n`
            : ""
        }` +
        `Admin tez orada siz bilan bog'lanadi! ⏱`,
      { parse_mode: "HTML", reply_markup: mainKeyboard(userId) }
    );

    await bot.api.sendMessage(
      ADMIN_ID,
      `🆕 <b>Yangi Buyurtma!</b>\n\n` +
        `👤 Mijoz: <b>${ctx.from.first_name}</b>\n` +
        `📱 Username: @${ctx.from.username || "yo'q"}\n` +
        `🆔 ID: <code>${userId}</code>\n\n` +
        `🤖 Bot: <b>${botType.emoji} ${botType.name}</b>\n` +
        `💰 Narx: <b>${formatPrice(botType.price)}</b>\n` +
        `🏷 Buyurtma ID: <code>${order.id}</code>\n\n` +
        `📝 <b>Talablar:</b>\n${requirements}`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard()
          .text("✅ Tasdiqlash", `confirm_order_${order.id}`)
          .text("❌ Bekor", `cancel_order_${order.id}`)
          .row()
          .text("💬 Bog'lanish", `contact_user_${userId}`),
      }
    );
  }
});

bot.callbackQuery(/^confirm_order_(.+)$/, async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) { await ctx.answerCallbackQuery("Ruxsat yo'q"); return; }
  const orderId = ctx.match[1]!;
  const { updateOrderStatus, getAllOrders } = await import("./storage.js");
  updateOrderStatus(orderId, "confirmed");
  const order = getAllOrders().find((o) => o.id === orderId);
  await ctx.answerCallbackQuery("✅ Tasdiqlandi!");
  const msgText = (ctx as any)?.callbackQuery?.message?.text as string | undefined;
  if (msgText) {
    await ctx.editMessageText(msgText + "\n\n✅ TASDIQLANDI", { parse_mode: "HTML" });
  }
  if (order) {
    await bot.api.sendMessage(
      order.userId,
      `✅ <b>Buyurtmangiz tasdiqlandi!</b>\n\n` +
        `🤖 Bot: ${order.botName}\n` +
        `🏷 ID: <code>${order.id}</code>\n\n` +
        `Admin 3-7 ish kuni ichida tayyor qiladi. Kutib qoling! 🚀`,
      { parse_mode: "HTML" }
    );
  }
});

bot.callbackQuery(/^cancel_order_(.+)$/, async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) { await ctx.answerCallbackQuery("Ruxsat yo'q"); return; }
  const orderId = ctx.match[1]!;
  const { updateOrderStatus, getAllOrders } = await import("./storage.js");
  updateOrderStatus(orderId, "cancelled");
  const order = getAllOrders().find((o) => o.id === orderId);
  await ctx.answerCallbackQuery("❌ Bekor qilindi");
  const msgText = (ctx as any)?.callbackQuery?.message?.text as string | undefined;
  if (msgText) {
    await ctx.editMessageText(msgText + "\n\n❌ BEKOR QILINDI", { parse_mode: "HTML" });
  }
  if (order) {
    await bot.api.sendMessage(
      order.userId,
      `❌ <b>Buyurtmangiz bekor qilindi</b>\n\nBatafsil ma'lumot uchun adminга murojaat qiling.`,
      { parse_mode: "HTML" }
    );
  }
});

bot.callbackQuery(/^contact_user_(\d+)$/, async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) { await ctx.answerCallbackQuery("Ruxsat yo'q"); return; }
  const userId = ctx.match[1];
  await ctx.answerCallbackQuery();
  await ctx.reply(`💬 Foydalanuvchi bilan bog'lanish: tg://user?id=${userId}`);
});

export async function startBot(): Promise<void> {
  const webhookUrl = process.env["WEBHOOK_URL"];
  const isProd = process.env["NODE_ENV"] === "production";
  if (isProd && webhookUrl) {
    logger.info({ webhookUrl }, "Bot running in webhook mode");
    await bot.api.setWebhook(webhookUrl);
  } else {
    logger.info("Bot starting in polling mode");
    await bot.api.deleteWebhook({ drop_pending_updates: true });
    void bot.start({
      onStart: (info) => logger.info({ username: info.username }, "Bot started (polling)"),
    });
  }
}

export async function setupSubscriptionCron(): Promise<void> {
  const { default: cron } = await import("node-cron");
  const { getExpiredTrialUsers, markNotified } = await import("./storage.js");
  cron.schedule("0 9 * * *", async () => {
    const expired = getExpiredTrialUsers();
    for (const user of expired) {
      try {
        await bot.api.sendMessage(
          user.id,
          `⏰ <b>Sinov muddatingiz tugadi!</b>\n\n` +
            `Botingiz to'xtatilmasligi uchun obunani yangilang:\n\n` +
            `💰 Narx: <b>50,000 so'm/oy</b>\n` +
            `🏦 Karta: <code>${PAYMENT_CARD}</code>\n` +
            `👤 Ism: <b>${PAYMENT_NAME}</b>\n\n` +
            `To'lovdan so'ng /start yuboring va obunani faollashtiring! 🚀`,
          { parse_mode: "HTML" }
        );
        markNotified(user.id);
      } catch {}
    }
  });
  logger.info("Subscription cron job scheduled");
}
