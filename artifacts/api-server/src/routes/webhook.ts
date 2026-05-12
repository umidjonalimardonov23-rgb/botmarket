import { Router } from "express";
import { logger } from "../lib/logger";
import { db } from "@workspace/db";
import { botsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const MINI_APP_URL = process.env.MINI_APP_URL || `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || ""}`;
const ADMIN_ID = 7575930751;

// Majburiy obuna kanallari
const CHANNELS = [
  { id: "@UzBOTpro_org",   label: "UzBOT Pro | Kanal",  url: "https://t.me/UzBOTpro_org" },
  { id: "@UzBOTpro_guroup", label: "UzBOT Pro | Guruh",  url: "https://t.me/UzBOTpro_guroup" },
];

// ─── Telegram helpers ────────────────────────────────────────────────────────

async function tg(method: string, body: object): Promise<any> {
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.json();
  } catch (e) {
    logger.error({ e }, "Telegram API error");
    return { ok: false };
  }
}

async function sendMessage(chatId: number | string, text: string, extra: object = {}) {
  return tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...extra });
}

async function editMessage(chatId: number | string, msgId: number, text: string, extra: object = {}) {
  return tg("editMessageText", { chat_id: chatId, message_id: msgId, text, parse_mode: "HTML", ...extra });
}

async function notifyAdmin(text: string) {
  return sendMessage(ADMIN_ID, text);
}

// ─── Subscription check ──────────────────────────────────────────────────────

async function isMember(userId: number, channelId: string): Promise<boolean> {
  try {
    const r = await tg("getChatMember", { chat_id: channelId, user_id: userId });
    const status: string = r?.result?.status ?? "left";
    return ["creator", "administrator", "member"].includes(status);
  } catch {
    return false;
  }
}

/** Returns array of [bool, bool] for each CHANNELS entry */
async function checkAll(userId: number): Promise<boolean[]> {
  return Promise.all(CHANNELS.map((c) => isMember(userId, c.id)));
}

// ─── Messages ────────────────────────────────────────────────────────────────

function subscribeMessage(results: boolean[]): { text: string; reply_markup: object } {
  const allJoined = results.every(Boolean);

  const lines = CHANNELS.map((c, i) =>
    results[i]
      ? `✅  <a href="${c.url}">${c.label}</a>`
      : `❌  <a href="${c.url}">${c.label}</a>`
  );

  const text =
    `🔐 <b>Botdan foydalanish uchun avval obuna bo'ling!</b>\n\n` +
    `Quyidagi kanal va guruhga <b>a'zo bo'ling</b>, so'ng ✅ tugmasini bosing:\n\n` +
    lines.join("\n") +
    `\n\n` +
    (allJoined
      ? `🎉 <b>Rahmat! Obunalar tasdiqlandi. Kirish oching 👇</b>`
      : `⚠️ Hali obuna bo'lmagan manzillar bor. Obuna bo'lib, <b>✅ Tekshirish</b> tugmasini bosing.`);

  const buttons: object[][] = [];

  CHANNELS.forEach((c, i) => {
    if (!results[i]) {
      buttons.push([{ text: `📢 ${c.label}ga o'tish`, url: c.url }]);
    }
  });

  buttons.push([
    { text: allJoined ? "🚀 BotMarket ochish" : "✅ Tekshirish", callback_data: "check_sub" },
  ]);

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function welcomeMessage(firstName: string): { text: string; reply_markup: object } {
  return {
    text:
      `╔══════════════════════╗\n` +
      `║  🤖  <b>BotMarket</b>  ║\n` +
      `╚══════════════════════╝\n\n` +
      `Xush kelibsiz, <b>${firstName}</b>! 👋\n\n` +
      `🇺🇿 <b>O'zbekistonning №1 Telegram Bot Bozori</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🤖  <b>45+</b> foydali bot\n` +
      `📂  <b>10</b> kategoriya\n` +
      `⭐  Real foydalanuvchi reytinglari\n` +
      `🆓  <b>1 hafta bepul!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `💡 Botlarni qidiring, baholang va yangilarini qo'shing!\n\n` +
      `👇 <b>Mini Appni oching va boshlang:</b>`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 BotMarket ni ochish", web_app: { url: MINI_APP_URL } }],
        [
          { text: "🤖 Top Botlar",    callback_data: "top_bots"   },
          { text: "📂 Kategoriyalar", callback_data: "categories" },
        ],
        [
          { text: "ℹ️ Haqida", callback_data: "about" },
          { text: "🆘 Yordam", callback_data: "help"  },
        ],
      ],
    },
  };
}

// ─── Bot commands ────────────────────────────────────────────────────────────

async function setCommands() {
  const base = [
    { command: "start",      description: "🚀 Botni boshlash"         },
    { command: "bots",       description: "🤖 Top botlar ro'yxati"    },
    { command: "categories", description: "📂 Kategoriyalar"           },
    { command: "about",      description: "ℹ️ BotMarket haqida"       },
    { command: "help",       description: "🆘 Yordam"                 },
  ];
  await tg("setMyCommands", { commands: base });
  await tg("setMyCommands", {
    commands: [
      ...base,
      { command: "stats",   description: "📊 Statistika (admin)"           },
      { command: "users",   description: "👥 Foydalanuvchilar (admin)"     },
      { command: "pending", description: "📋 Kutayotgan botlar (admin)"    },
      { command: "broadcast", description: "📢 Ommaviy xabar (admin)"      },
    ],
    scope: { type: "chat", chat_id: ADMIN_ID },
  });
}
// "Menyu" tugmasi o'rniga to'g'ridan-to'g'ri Mini App ochuvchi tugma
async function setMenuButton() {
  await tg("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "🚀 BotMarket",
      web_app: { url: MINI_APP_URL },
    },
  });
}

setCommands().catch(() => {});
setMenuButton().catch(() => {});

// ─── Utils ───────────────────────────────────────────────────────────────────

function isAdmin(id: number) { return id === ADMIN_ID; }

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0)     + "K";
  return String(n);
}

// ─── Main handler ────────────────────────────────────────────────────────────

router.post("/", async (req, res) => {
  res.json({ ok: true });

  try {
    const update = req.body;

    // ── Callback queries ──────────────────────────────────────────────────────
    if (update?.callback_query) {
      const cb      = update.callback_query;
      const cbId    = cb.id;
      const chatId  = cb.message?.chat?.id;
      const msgId   = cb.message?.message_id;
      const userId  = cb.from?.id;
      const data    = cb.data as string;

      await tg("answerCallbackQuery", { callback_query_id: cbId });

      if (data === "check_sub") {
        const results = await checkAll(userId);
        const allOk   = results.every(Boolean);
        const { text, reply_markup } = subscribeMessage(results);
        await editMessage(chatId, msgId, text, { reply_markup, disable_web_page_preview: true });

        if (allOk) {
          // Give welcome after short delay
          setTimeout(async () => {
            const { text: wt, reply_markup: wrm } = welcomeMessage(cb.from?.first_name || "Do'stim");
            await sendMessage(chatId, wt, { reply_markup: wrm });
          }, 800);
        }
        return;
      }

      if (data === "top_bots") {
        await sendMessage(chatId,
          `🤖 <b>Barcha botlarni ko'rish uchun BotMarket ni oching!</b>\n\n` +
          `45+ bot, 10 kategoriya, real reytinglar bilan.`,
          { reply_markup: { inline_keyboard: [[{ text: "🚀 BotMarket ochish", web_app: { url: MINI_APP_URL } }]] } }
        );
        return;
      }

      if (data === "categories") {
        await sendMessage(chatId,
          "📂 <b>Kategoriyalar:</b>\n\n" +
          "🎮 O'yinlar\n📚 Ta'lim\n🎭 Ko'ngil ochar\n🔧 Asboblar\n" +
          "📰 Yangiliklar\n🎵 Musiqa\n🛒 Xarid\n💰 Moliya\n👥 Ijtimoiy\n⚙️ Admin\n\n" +
          "📱 Kategoriya bo'yicha qidirish uchun Mini Appni oching!",
          { reply_markup: { inline_keyboard: [[{ text: "🚀 Mini App", web_app: { url: MINI_APP_URL } }]] } }
        );
        return;
      }

      if (data === "about") {
        await sendMessage(chatId,
          `🤖 <b>BotMarket v1.0</b>\n\n` +
          `O'zbekistonning №1 Telegram bot marketplace!\n\n` +
          `• 45+ foydali bot\n• 10 kategoriya\n• 1 hafta bepul\n\n` +
          `👨‍💼 Murojaat: @UzBOTpro_bot`
        );
        return;
      }

      if (data === "help") {
        await sendMessage(chatId,
          `<b>BotMarket — Yordam markazi</b>\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📌  /start — Botni qayta ishga tushirish\n` +
          `🤖  /bots — Top 10 bot ro'yxati\n` +
          `📂  /categories — Barcha kategoriyalar\n` +
          `ℹ️  /about — BotMarket haqida\n` +
          `🆘  /help — Shu sahifa\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🔗  <b>Rasmiy kanallar:</b>\n\n` +
          `📢  <a href="https://t.me/UzBOTpro_org"><b>UzBOT Pro | Kanal</b></a>\n` +
          `    Yangiliklar, e'lonlar, botlar\n\n` +
          `💬  <a href="https://t.me/UzBOTpro_guroup"><b>UzBOT Pro | Guruh</b></a>\n` +
          `    Savol-javob, muhokama, maslaxat\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `👨‍💼  <b>Admin:</b> @UzBOTpro_bot\n` +
          `📱  <b>Mini App:</b> BotMarket`,
          {
            disable_web_page_preview: true,
            reply_markup: {
              inline_keyboard: [
                [{ text: "📢 Kanal", url: "https://t.me/UzBOTpro_org" }, { text: "💬 Guruh", url: "https://t.me/UzBOTpro_guroup" }],
                [{ text: "🚀 BotMarket ochish", web_app: { url: MINI_APP_URL } }],
              ],
            },
          }
        );
        return;
      }

      return;
    }

    // ── Messages ──────────────────────────────────────────────────────────────
    const message = update?.message;
    if (!message) return;

    const chatId    = message.chat.id as number;
    const userId    = message.from?.id as number;
    const text      = (message.text || "") as string;
    const firstName = (message.from?.first_name || "Do'stim") as string;
    const username  = (message.from?.username || "") as string;
    const admin     = isAdmin(userId);

    // Skip subscription check for admin
    if (!admin) {
      const results = await checkAll(userId);
      const allOk   = results.every(Boolean);

      if (!allOk) {
        const { text: st, reply_markup } = subscribeMessage(results);
        await sendMessage(chatId, st, { reply_markup, disable_web_page_preview: true });
        return; // Block all commands until subscribed
      }
    }

    // ── /start ────────────────────────────────────────────────────────────────
    if (text === "/start" || text.startsWith("/start ")) {
      const { text: wt, reply_markup } = welcomeMessage(firstName);
      await sendMessage(chatId, wt, { reply_markup });

      if (!admin) {
        await notifyAdmin(
          `👤 <b>Yangi foydalanuvchi kirdi!</b>\n\n` +
          `Ism: <b>${firstName}</b>\n` +
          `ID: <code>${userId}</code>\n` +
          `Username: @${username || "yo'q"}`
        );
      }
    }

    // ── /bots ─────────────────────────────────────────────────────────────────
    else if (text === "/bots") {
      await sendMessage(chatId,
        `🤖 <b>BotMarket — 45+ bot, 10 kategoriya!</b>\n\n` +
        `Barcha botlarni ko'rish, qidirish va baholash uchun Mini Appni oching:`,
        { reply_markup: { inline_keyboard: [[{ text: "🚀 BotMarket ochish", web_app: { url: MINI_APP_URL } }]] } }
      );
    }

    // ── /categories ───────────────────────────────────────────────────────────
    else if (text === "/categories") {
      await sendMessage(chatId,
        "📂 <b>Kategoriyalar:</b>\n\n" +
        "🎮 O'yinlar\n📚 Ta'lim\n🎭 Ko'ngil ochar\n🔧 Asboblar\n" +
        "📰 Yangiliklar\n🎵 Musiqa\n🛒 Xarid\n💰 Moliya\n👥 Ijtimoiy\n⚙️ Admin\n\n" +
        "📱 Kategoriya bo'yicha qidirish uchun Mini Appni oching!",
        { reply_markup: { inline_keyboard: [[{ text: "🚀 Mini App", web_app: { url: MINI_APP_URL } }]] } }
      );
    }

    // ── /help ─────────────────────────────────────────────────────────────────
    else if (text === "/help") {
      await sendMessage(chatId,
        `<b>BotMarket — Yordam markazi</b>\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📌  /start — Botni qayta ishga tushirish\n` +
        `🤖  /bots — Top 10 bot ro'yxati\n` +
        `📂  /categories — Barcha kategoriyalar\n` +
        `ℹ️  /about — BotMarket haqida\n` +
        `🆘  /help — Shu sahifa\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🔗  <b>Rasmiy kanallar:</b>\n\n` +
        `📢  <a href="https://t.me/UzBOTpro_org"><b>UzBOT Pro | Kanal</b></a>\n` +
        `    Yangiliklar, e'lonlar, botlar\n\n` +
        `💬  <a href="https://t.me/UzBOTpro_guroup"><b>UzBOT Pro | Guruh</b></a>\n` +
        `    Savol-javob, muhokama, maslaxat\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👨‍💼  <b>Admin:</b> @UzBOTpro_bot\n` +
        `📱  <b>Mini App:</b> BotMarket`,
        {
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [{ text: "📢 Kanal", url: "https://t.me/UzBOTpro_org" }, { text: "💬 Guruh", url: "https://t.me/UzBOTpro_guroup" }],
              [{ text: "🚀 BotMarket ochish", web_app: { url: MINI_APP_URL } }],
            ],
          },
        }
      );
    }

    // ── /about ────────────────────────────────────────────────────────────────
    else if (text === "/about") {
      await sendMessage(chatId,
        `╔══════════════════════╗\n` +
        `║  🤖  <b>BotMarket v1.0</b>  ║\n` +
        `╚══════════════════════╝\n\n` +
        `<b>O'zbekistonning №1 Telegram Bot Bozori</b>\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🤖 <b>45+</b> foydali bot\n` +
        `📂 <b>10</b> kategoriya\n` +
        `⭐ Real reyting va izohlar\n` +
        `🆓 <b>1 hafta bepul!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `💡 1 haftadan so'ng to'lov tizimi yoqiladi.\n` +
        `Admin: @UzBOTpro_bot`
      );
    }

    // ── Admin: /stats ─────────────────────────────────────────────────────────
    else if (text === "/stats" && admin) {
      await sendMessage(chatId,
        `📊 <b>Admin Panel — Statistika</b>\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🤖 Jami botlar: <b>45</b>\n` +
        `📂 Kategoriyalar: <b>10</b>\n` +
        `👥 Foydalanuvchilar: <b>faol</b>\n` +
        `💰 Daromad: <b>1 hafta bepul davr</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `⏰ ${new Date().toLocaleString("uz-UZ")}`
      );
    }

    // ── Admin: /pending ───────────────────────────────────────────────────────
    else if (text === "/pending" && admin) {
      await sendMessage(chatId,
        `📋 <b>Kutayotgan botlar</b>\n\n` +
        `Hozirda tekshiruvni kutayotgan bot yo'q.\n\n` +
        `Bot qo'shish uchun Mini Appdan foydalaning.`
      );
    }

    // ── Admin: /users ─────────────────────────────────────────────────────────
    else if (text === "/users" && admin) {
      await sendMessage(chatId,
        `👥 <b>Foydalanuvchilar paneli</b>\n\n` +
        `Kelajakda to'liq statistika qo'shiladi.\n\n` +
        `Hozircha: /start bosgan barcha foydalanuvchilar haqida bildirishnoma olasiz.`
      );
    }

    // ── Admin: /broadcast ─────────────────────────────────────────────────────
    else if (text.startsWith("/broadcast ") && admin) {
      const broadcastText = text.replace("/broadcast ", "").trim();
      if (!broadcastText) {
        await sendMessage(chatId, "❗ Xabar matnini kiriting: /broadcast <matn>");
      } else {
        await sendMessage(chatId, `✅ Xabar yuborildi:\n\n${broadcastText}\n\n(Hozircha test rejimida)`);
      }
    }

    // ── Unknown command ───────────────────────────────────────────────────────
    else if (text.startsWith("/")) {
      await sendMessage(chatId,
        `❓ Noma'lum buyruq.\n\n/help — yordam ko'rish`, {
          reply_markup: { inline_keyboard: [[{ text: "🚀 BotMarket", web_app: { url: MINI_APP_URL } }]] },
        }
      );
    }

  } catch (err) {
    logger.error({ err }, "Webhook handler error");
  }
});

export { notifyAdmin };
export default router;
