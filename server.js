import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Bot, InlineKeyboard } from "grammy";
import cron from "node-cron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data.json");

// ─── Storage ─────────────────────────────────────────────────────────────────
function load() {
  try { if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")); }
  catch {}
  return { users: {}, orders: {} };
}
function save(db) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); } catch {}
}
function getUser(id) { return load().users[id]; }
function upsertUser(user) { const db = load(); db.users[user.id] = user; save(db); }
function createUser(id, firstName, username, refBy) {
  const existing = getUser(id);
  if (existing) return existing;
  const user = { id, firstName, username, refBy, refs: [], trialStart: Date.now(), orderCount: 0 };
  if (refBy) {
    const db = load();
    if (db.users[refBy]) { db.users[refBy].refs.push(id); }
    db.users[id] = user;
    save(db);
  } else { upsertUser(user); }
  return user;
}
function createOrder(order) {
  const db = load();
  const id = "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  const newOrder = { ...order, id, createdAt: Date.now() };
  db.orders[id] = newOrder;
  if (db.users[order.userId]) db.users[order.userId].orderCount = (db.users[order.userId].orderCount || 0) + 1;
  save(db);
  return newOrder;
}
function getUserOrders(userId) {
  return Object.values(load().orders).filter(o => o.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
}
function updateOrderStatus(id, status) {
  const db = load();
  if (db.orders[id]) { db.orders[id].status = status; save(db); }
}
function getAllUsers() { return Object.values(load().users); }
function getAllOrders() { return Object.values(load().orders).sort((a, b) => b.createdAt - a.createdAt); }
function isTrialActive(user) {
  const week = 7 * 24 * 60 * 60 * 1000;
  if (user.paidUntil && user.paidUntil > Date.now()) return true;
  return Date.now() - user.trialStart < week;
}
function trialDaysLeft(user) {
  const week = 7 * 24 * 60 * 60 * 1000;
  if (user.paidUntil && user.paidUntil > Date.now()) return Math.ceil((user.paidUntil - Date.now()) / 86400000);
  return Math.max(0, Math.ceil((week - (Date.now() - user.trialStart)) / 86400000));
}
function getExpiredTrialUsers() {
  const week = 7 * 24 * 60 * 60 * 1000;
  return Object.values(load().users).filter(u => {
    if (u.paidUntil && u.paidUntil > Date.now()) return false;
    if (u.notified) return false;
    return Date.now() - u.trialStart > week;
  });
}
function markNotified(userId) {
  const db = load();
  if (db.users[userId]) { db.users[userId].notified = true; save(db); }
}

// ─── Catalog ─────────────────────────────────────────────────────────────────
const CATALOG = [
  { id:"admin",   name:"Admin Bot",    emoji:"👨‍💼", price:50000,  desc:"Guruh va kanal boshqaruvi",        feats:["Spam filter","Kicker/Banner","Ogohlantirish","Statistika"] },
  { id:"channel", name:"Kanal Bot",    emoji:"📢",  price:80000,  desc:"Post yuborish, obuna tekshirish",  feats:["Auto post","Obuna tekshirish","Rejalashtirish","Statistika"] },
  { id:"form",    name:"Ariza Bot",    emoji:"📝",  price:100000, desc:"Ma'lumot yig'ish, anketalar",      feats:["Forma yaratish","Javoblarni saqlash","Excel eksport","Xabarnoma"] },
  { id:"quiz",    name:"Quiz Bot",     emoji:"🎓",  price:120000, desc:"Testlar va sertifikatlar",         feats:["Ko'p tanlovli savol","Ball tizimi","Sertifikat","Reyting"] },
  { id:"shop",    name:"Do'kon Bot",   emoji:"🛒",  price:150000, desc:"Online savdo, katalog, to'lov",    feats:["Mahsulot katalog","Savatcha","To'lov tizimi","Buyurtma"], popular:true },
  { id:"booking", name:"Booking Bot",  emoji:"📅",  price:150000, desc:"Uchrashuv va xona bron qilish",    feats:["Kalendar","Bron tizimi","Eslatmalar","Bekor qilish"] },
  { id:"delivery",name:"Delivery Bot", emoji:"🚀",  price:180000, desc:"Yetkazib berish tizimi",           feats:["Buyurtma qabul","Status","Kuryer","Xarita"] },
  { id:"game",    name:"O'yin Bot",    emoji:"🎮",  price:200000, desc:"Mini o'yinlar va turnirlar",       feats:["Mini o'yinlar","Turnir","Reyting","Mukofot"] },
  { id:"crm",     name:"CRM Bot",      emoji:"💼",  price:250000, desc:"Mijozlar bazasi va hisobotlar",    feats:["Mijozlar bazasi","Hisobotlar","Funnel","Avtomatlashtirish"] },
  { id:"custom",  name:"Custom Bot",   emoji:"⚙️",  price:0,      desc:"Maxsus bot — narx kelishiladi",    feats:["To'liq individual","Har qanday","Yordam","Istalgan"] },
];
function fmt(p) { return p ? p.toLocaleString("ru-RU") + " so'm" : "Narx kelishiladi"; }
function getBotById(id) { return CATALOG.find(b => b.id === id); }
function statusEmoji(s) { return ({pending:"⏳",confirmed:"✅",done:"🎉",cancelled:"❌"})[s] || "❓"; }

// ─── Config ───────────────────────────────────────────────────────────────────
const BOT_TOKEN   = process.env.BOT_TOKEN;
const ADMIN_ID    = Number(process.env.ADMIN_ID || "7575930751");
const PAYMENT_CARD = process.env.PAYMENT_CARD || "9860606760806673";
const PAYMENT_NAME = process.env.PAYMENT_NAME || "Alimardonov Umidjon";
const PORT        = Number(process.env.PORT || 3000);
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const IS_PROD     = process.env.NODE_ENV === "production";
const MINI_APP_URL = process.env.MINI_APP_URL || "";

if (!BOT_TOKEN) { console.error("BOT_TOKEN is required"); process.exit(1); }

// ─── Bot ──────────────────────────────────────────────────────────────────────
const bot = new Bot(BOT_TOKEN);
bot.catch(err => console.error("Bot error:", err.message));

const pending = new Map();

function mainKb() {
  const kb = new InlineKeyboard();
  if (MINI_APP_URL) kb.webApp("🛍 Botlar Do'koni", MINI_APP_URL).row();
  kb.text("🤖 Katalog","catalog").text("📦 Buyurtmalarim","my_orders").row()
    .text("👥 Referral","referral").text("💳 Obuna","subscription").row()
    .text("📞 Aloqa","contact").text("ℹ️ Haqida","about");
  return kb;
}

bot.command("start", async ctx => {
  const userId = ctx.from.id, firstName = ctx.from.first_name, username = ctx.from.username;
  const args = ctx.match;
  let refBy;
  if (args && args.startsWith("ref_")) { refBy = Number(args.replace("ref_","")); if (refBy===userId) refBy=undefined; }
  const user = createUser(userId, firstName, username, refBy);
  if (refBy && refBy !== userId) {
    try { await bot.api.sendMessage(refBy, `🎉 Yangi referral! <b>${firstName}</b> sizning havolangiz orqali qo'shildi!`, {parse_mode:"HTML"}); } catch {}
  }
  const days = trialDaysLeft(user);
  const trialText = isTrialActive(user) ? `✅ Sinov muddati: <b>${days} kun</b> qoldi` : `⚠️ Sinov muddati tugagan`;
  await ctx.reply(
    `👋 Xush kelibsiz, <b>${firstName}</b>!\n\n🤖 <b>BotMarket</b> — professional Telegram botlar do'koni\n\n📋 Bizda <b>10+ turdagi</b> bot mavjud\n💰 Narxlar: <b>50,000 so'mdan</b> boshlanadi\n🎁 Birinchi bot — <b>1 hafta bepul!</b>\n\n${trialText}\n\n👇 Quyidagi menyudan tanlang:`,
    { parse_mode:"HTML", reply_markup: mainKb() }
  );
});

bot.command("admin", async ctx => {
  if (ctx.from.id !== ADMIN_ID) return;
  const users = getAllUsers(), orders = getAllOrders().slice(0,5);
  const pendingCount = orders.filter(o => o.status==="pending").length;
  await ctx.reply(
    `📊 <b>Admin Panel</b>\n\n👤 Foydalanuvchilar: <b>${users.length}</b>\n📦 Jami buyurtmalar: <b>${getAllOrders().length}</b>\n⏳ Kutilayotgan: <b>${pendingCount}</b>\n\nSo'nggi buyurtmalar:\n` +
    orders.map(o => `${statusEmoji(o.status)} #${o.id} — ${o.botName} — ${o.userFirstName}`).join("\n"),
    { parse_mode:"HTML" }
  );
});

bot.callbackQuery("catalog", async ctx => {
  await ctx.answerCallbackQuery();
  const kb = new InlineKeyboard();
  CATALOG.forEach(b => { kb.text(`${b.emoji} ${b.name} — ${fmt(b.price)}`, `bot_${b.id}`).row(); });
  kb.text("🔙 Orqaga","back_main");
  await ctx.editMessageText(`🤖 <b>Botlar Katalogi</b>\n\nQuyidagi botlardan birini tanlang 👇`, {parse_mode:"HTML", reply_markup:kb});
});

bot.callbackQuery(/^bot_(.+)$/, async ctx => {
  await ctx.answerCallbackQuery();
  const b = getBotById(ctx.match[1]);
  if (!b) return;
  const kb = new InlineKeyboard().text("✅ Buyurtma berish",`order_${b.id}`).row().text("🔙 Katalogga","catalog");
  await ctx.editMessageText(
    `${b.emoji} <b>${b.name}</b>\n\n📝 ${b.desc}\n\n✨ <b>Imkoniyatlar:</b>\n${b.feats.map(f=>`  • ${f}`).join("\n")}\n\n💰 <b>Narx: ${fmt(b.price)}</b>\n\n⏱ Bajarish muddati: 3-7 ish kuni`,
    {parse_mode:"HTML", reply_markup:kb}
  );
});

bot.callbackQuery(/^order_(.+)$/, async ctx => {
  await ctx.answerCallbackQuery();
  const b = getBotById(ctx.match[1]);
  if (!b) return;
  pending.set(ctx.from.id, { botId: b.id, step:"requirements" });
  await ctx.editMessageText(
    `📝 <b>${b.emoji} ${b.name}</b> buyurtma\n\nIltimos, botingiz uchun talablarni yozing:\n• Bot nima qilishi kerak?\n• Qanday funksiyalar kerak?\n• Qo'shimcha istaklaringiz?\n\n💬 Xabar yuboring:`,
    {parse_mode:"HTML"}
  );
});

bot.callbackQuery("my_orders", async ctx => {
  await ctx.answerCallbackQuery();
  const orders = getUserOrders(ctx.from.id);
  if (!orders.length) {
    await ctx.editMessageText(`📦 <b>Buyurtmalarim</b>\n\nHali buyurtma bermadingiz.\n\n🛍 Katalogdan bot tanlang!`,
      {parse_mode:"HTML", reply_markup: new InlineKeyboard().text("🤖 Katalog","catalog").text("🔙 Orqaga","back_main")});
    return;
  }
  const text = `📦 <b>Buyurtmalarim</b> (${orders.length} ta)\n\n` +
    orders.map(o => `${statusEmoji(o.status)} <b>${o.botName}</b>\n   💰 ${fmt(o.price)}\n   🏷 ${o.id}`).join("\n\n");
  await ctx.editMessageText(text, {parse_mode:"HTML", reply_markup: new InlineKeyboard().text("🔙 Orqaga","back_main")});
});

bot.callbackQuery("referral", async ctx => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from.id;
  const user = getUser(userId) || createUser(userId, ctx.from.first_name, ctx.from.username);
  const info = await bot.api.getMe();
  const link = `https://t.me/${info.username}?start=ref_${userId}`;
  await ctx.editMessageText(
    `👥 <b>Referral Tizimi</b>\n\n🔗 Sizning havola:\n<code>${link}</code>\n\n👤 Taklif qilganlaringiz: <b>${user.refs.length} kishi</b>\n\n🎁 <b>Bonuslar:</b>\n• Har bir referral — maxsus chegirma\n• 5+ referral — 1 oy bepul server\n• 10+ referral — katta sovg'a!\n\n💡 Havolani do'stlaringizga yuboring!`,
    {parse_mode:"HTML", reply_markup: new InlineKeyboard().text("🔙 Orqaga","back_main")}
  );
});

bot.callbackQuery("subscription", async ctx => {
  await ctx.answerCallbackQuery();
  const user = getUser(ctx.from.id) || createUser(ctx.from.id, ctx.from.first_name, ctx.from.username);
  const active = isTrialActive(user), days = trialDaysLeft(user);
  const kb = new InlineKeyboard();
  if (!active) kb.text("💳 To'lov qilish","pay_subscription").row();
  kb.text("🔙 Orqaga","back_main");
  await ctx.editMessageText(
    `💳 <b>Obuna holati</b>\n\n${active ? `✅ <b>Faol</b> — ${days} kun qoldi\n\n⚡ Barcha xizmatlar ochiq!` :
    `❌ <b>Tugagan</b>\n\nBotingiz to'xtatilmasligi uchun obunani yangilang.\n\n💰 <b>Narx: 50,000 so'm/oy</b>\n🏦 Karta: <code>${PAYMENT_CARD}</code>\n👤 Ism: <b>${PAYMENT_NAME}</b>\n\nTo'lovdan so'ng admin ga screenshot yuboring`}\n\n📋 <b>Tarif:</b>\n• 1 oy — 50,000 so'm\n• 3 oy — 130,000 so'm\n• 1 yil — 450,000 so'm`,
    {parse_mode:"HTML", reply_markup:kb}
  );
});

bot.callbackQuery("pay_subscription", async ctx => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `💳 <b>To'lov</b>\n\n🏦 Karta raqami:\n<code>${PAYMENT_CARD}</code>\n\n👤 Ism: <b>${PAYMENT_NAME}</b>\n💰 Miqdor: <b>50,000 so'm</b>\n\n📸 To'lov screenshot ini yuboring va "To'ladim" tugmasini bosing`,
    {parse_mode:"HTML", reply_markup: new InlineKeyboard().text("✅ To'ladim, tekshiring","check_payment").row().text("🔙 Orqaga","subscription")}
  );
});

bot.callbackQuery("check_payment", async ctx => {
  await ctx.answerCallbackQuery("Adminга yuborildi, tez orada tekshiriladi! ✅");
  await bot.api.sendMessage(ADMIN_ID,
    `💳 <b>To'lov tekshiruvi</b>\n\n👤 Foydalanuvchi: <b>${ctx.from.first_name}</b>\n🆔 ID: <code>${ctx.from.id}</code>\n📱 Username: @${ctx.from.username||"yo'q"}\n\nTo'lovni tekshiring va tasdiqlang:`,
    {parse_mode:"HTML", reply_markup: new InlineKeyboard().text("✅ Tasdiqlash",`confirm_pay_${ctx.from.id}`).text("❌ Rad etish",`reject_pay_${ctx.from.id}`)}
  );
});

bot.callbackQuery(/^confirm_pay_(\d+)$/, async ctx => {
  if (ctx.from.id !== ADMIN_ID) { await ctx.answerCallbackQuery("Ruxsat yo'q"); return; }
  const userId = Number(ctx.match[1]);
  const user = getUser(userId);
  if (user) { user.paidUntil = Date.now() + 30*24*60*60*1000; user.notified = false; upsertUser(user); }
  await ctx.answerCallbackQuery("✅ Tasdiqlandi!");
  await bot.api.sendMessage(userId, `🎉 <b>Obuna faollashtirildi!</b>\n\n✅ 30 kunlik obuna boshlandi.\nBarcha xizmatlardan foydalaning!`, {parse_mode:"HTML"});
});

bot.callbackQuery(/^reject_pay_(\d+)$/, async ctx => {
  if (ctx.from.id !== ADMIN_ID) { await ctx.answerCallbackQuery("Ruxsat yo'q"); return; }
  await ctx.answerCallbackQuery("❌ Rad etildi");
  await bot.api.sendMessage(Number(ctx.match[1]), `❌ <b>To'lov tasdiqlanmadi</b>\n\nIltimos, to'g'ri miqdorda to'lab, screenshot yuboring.\n\n🏦 Karta: <code>${PAYMENT_CARD}</code>`, {parse_mode:"HTML"});
});

bot.callbackQuery("contact", async ctx => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `📞 <b>Aloqa</b>\n\n👨‍💻 Admin: @admin\n⏰ Ish vaqti: 09:00 — 22:00\n📩 Javob muddati: 1-2 soat\n\n❓ Savollaringiz bo'lsa, adminга yozing!`,
    {parse_mode:"HTML", reply_markup: new InlineKeyboard().url("💬 Admin bilan bog'lanish","https://t.me/admin").row().text("🔙 Orqaga","back_main")}
  );
});

bot.callbackQuery("about", async ctx => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `ℹ️ <b>BotMarket haqida</b>\n\n🤖 Professional Telegram botlar yaratish xizmati\n\n✅ <b>Afzalliklar:</b>\n• 10+ turdagi tayyor bot\n• Narxlar: 50,000 so'mdan\n• Bajarish: 3-7 ish kuni\n• 1 hafta bepul sinov\n• 24/7 texnik qo'llab-quvvatlash\n\n💡 Botingizni buyurtma bering va biznesingizni avtomatlashiring!`,
    {parse_mode:"HTML", reply_markup: new InlineKeyboard().text("🔙 Orqaga","back_main")}
  );
});

bot.callbackQuery("back_main", async ctx => {
  await ctx.answerCallbackQuery();
  const user = getUser(ctx.from.id) || createUser(ctx.from.id, ctx.from.first_name, ctx.from.username);
  const days = trialDaysLeft(user);
  const trialText = isTrialActive(user) ? `✅ Sinov muddati: <b>${days} kun</b> qoldi` : `⚠️ Sinov muddati tugagan — <b>obunani yangilang</b>`;
  await ctx.editMessageText(`🏠 <b>Asosiy Menyu</b>\n\n${trialText}\n\nNimani xohlaysiz? 👇`, {parse_mode:"HTML", reply_markup: mainKb()});
});

bot.callbackQuery(/^confirm_order_(.+)$/, async ctx => {
  if (ctx.from.id !== ADMIN_ID) { await ctx.answerCallbackQuery("Ruxsat yo'q"); return; }
  const orderId = ctx.match[1];
  updateOrderStatus(orderId, "confirmed");
  const order = getAllOrders().find(o => o.id === orderId);
  await ctx.answerCallbackQuery("✅ Tasdiqlandi!");
  if (order) await bot.api.sendMessage(order.userId, `✅ <b>Buyurtmangiz tasdiqlandi!</b>\n\n🤖 Bot: ${order.botName}\n🏷 ID: <code>${order.id}</code>\n\nAdmin 3-7 ish kuni ichida tayyor qiladi. Kutib qoling! 🚀`, {parse_mode:"HTML"});
});

bot.callbackQuery(/^cancel_order_(.+)$/, async ctx => {
  if (ctx.from.id !== ADMIN_ID) { await ctx.answerCallbackQuery("Ruxsat yo'q"); return; }
  const orderId = ctx.match[1];
  updateOrderStatus(orderId, "cancelled");
  const order = getAllOrders().find(o => o.id === orderId);
  await ctx.answerCallbackQuery("❌ Bekor qilindi");
  if (order) await bot.api.sendMessage(order.userId, `❌ <b>Buyurtmangiz bekor qilindi</b>\n\nBatafsil ma'lumot uchun adminга murojaat qiling.`, {parse_mode:"HTML"});
});

bot.on("message:text", async ctx => {
  const userId = ctx.from.id;
  const p = pending.get(userId);
  if (!p) return;
  if (p.step === "requirements") {
    const b = getBotById(p.botId);
    if (!b) return;
    const requirements = ctx.message.text;
    const order = createOrder({ userId, userFirstName: ctx.from.first_name, username: ctx.from.username, botType:b.id, botName:`${b.emoji} ${b.name}`, requirements, status:"pending", price:b.price });
    pending.delete(userId);
    await ctx.reply(
      `✅ <b>Buyurtma qabul qilindi!</b>\n\n📋 Bot: <b>${b.emoji} ${b.name}</b>\n💰 Narx: <b>${fmt(b.price)}</b>\n🏷 ID: <code>${order.id}</code>\n\n${b.price > 0 ? `💳 <b>To'lov:</b>\n🏦 Karta: <code>${PAYMENT_CARD}</code>\n👤 Ism: ${PAYMENT_NAME}\n\n` : ""}Admin tez orada siz bilan bog'lanadi! ⏱`,
      {parse_mode:"HTML", reply_markup: mainKb()}
    );
    await bot.api.sendMessage(ADMIN_ID,
      `🆕 <b>Yangi Buyurtma!</b>\n\n👤 Mijoz: <b>${ctx.from.first_name}</b>\n📱 Username: @${ctx.from.username||"yo'q"}\n🆔 ID: <code>${userId}</code>\n\n🤖 Bot: <b>${b.emoji} ${b.name}</b>\n💰 Narx: <b>${fmt(b.price)}</b>\n🏷 Buyurtma ID: <code>${order.id}</code>\n\n📝 <b>Talablar:</b>\n${requirements}`,
      {parse_mode:"HTML", reply_markup: new InlineKeyboard().text("✅ Tasdiqlash",`confirm_order_${order.id}`).text("❌ Bekor",`cancel_order_${order.id}`).row().text("💬 Bog'lanish",`contact_user_${userId}`)}
    );
  }
});

bot.callbackQuery(/^contact_user_(\d+)$/, async ctx => {
  if (ctx.from.id !== ADMIN_ID) { await ctx.answerCallbackQuery("Ruxsat yo'q"); return; }
  await ctx.answerCallbackQuery();
  await ctx.reply(`💬 Foydalanuvchi: tg://user?id=${ctx.match[1]}`);
});

// ─── Mini App HTML ────────────────────────────────────────────────────────────
function getMiniAppHtml() {
  const js = [
    "var tg=window.Telegram&&window.Telegram.WebApp;if(tg){tg.ready();tg.expand();}",
    "var CATALOG=[",
    "  {id:'admin',  name:'Admin Bot',    emoji:'\\u{1F468}\\u200D\\u{1F4BC}',price:50000, desc:\"Guruh va kanal boshqaruvi\",      feats:['Spam filter','Kicker','Ogohlantirish','Statistika'],pop:false},",
    "  {id:'channel',name:'Kanal Bot',    emoji:'\\u{1F4E2}',               price:80000, desc:'Post yuborish, obuna tekshirish', feats:['Auto post','Obuna','Rejalashtirish','Statistika'],pop:false},",
    "  {id:'form',   name:'Ariza Bot',    emoji:'\\u{1F4DD}',               price:100000,desc:\"Ma'lumot yig'ish, anketalar\",     feats:['Forma','Saqlash','Excel','Xabarnoma'],pop:false},",
    "  {id:'quiz',   name:'Quiz Bot',     emoji:'\\u{1F393}',               price:120000,desc:'Testlar va sertifikatlar',         feats:['Ko`p tanlov','Ball','Sertifikat','Reyting'],pop:false},",
    "  {id:'shop',   name:\"Do'kon Bot\",  emoji:'\\u{1F6D2}',               price:150000,desc:\"Online savdo, katalog, to'lov\",  feats:['Katalog','Savatcha',\"To'lov\",'Buyurtma'],pop:true},",
    "  {id:'booking',name:'Booking Bot',  emoji:'\\u{1F4C5}',               price:150000,desc:'Uchrashuv va xona bron qilish',    feats:['Kalendar','Bron','Eslatmalar','Bekor'],pop:false},",
    "  {id:'delivery',name:'Delivery Bot',emoji:'\\u{1F680}',               price:180000,desc:'Yetkazib berish tizimi',           feats:['Buyurtma','Status','Kuryer','Xarita'],pop:false},",
    "  {id:'game',   name:\"O'yin Bot\",   emoji:'\\u{1F3AE}',               price:200000,desc:\"Mini o'yinlar va turnirlar\",     feats:[\"Mini o'yin\",'Turnir','Reyting','Mukofot'],pop:false},",
    "  {id:'crm',    name:'CRM Bot',      emoji:'\\u{1F4BC}',               price:250000,desc:'Mijozlar bazasi va hisobotlar',    feats:['Mijozlar','Hisobotlar','Funnel','Avto'],pop:false},",
    "  {id:'custom', name:'Custom Bot',   emoji:'\\u2699\\uFE0F',            price:0,     desc:'Maxsus bot, narx kelishiladi',     feats:['Individual','Har qanday','Yordam','Istalgan'],pop:false}",
    "];",
    "function fmt(p){return p?p.toLocaleString('ru-RU')+\" so'm\":'Narx kelishiladi';}",
    "var sel=null;",
    "function render(){",
    "  var el=document.getElementById('catalog'),h='';",
    "  for(var i=0;i<CATALOG.length;i++){",
    "    var b=CATALOG[i];",
    "    var fh='';for(var j=0;j<b.feats.length;j++)fh+='<span class=\"feat\">'+b.feats[j]+'</span>';",
    "    h+='<div class=\"bc\" onclick=\"openBot('+i+')\">'+",
    "      (b.pop?'<div class=\"pb\">\\uD83D\\uDD25 Popular</div>':'')+",
    "      '<div class=\"ct\"><div class=\"ce\">'+b.emoji+'</div>'+",
    "      '<div class=\"ci\"><div class=\"cn\">'+b.name+'</div><div class=\"cd\">'+b.desc+'</div></div>'+",
    "      '<div class=\"cp\">'+fmt(b.price)+'</div></div>'+",
    "      '<div class=\"feats\">'+fh+'</div></div>';",
    "  }",
    "  el.innerHTML=h;",
    "}",
    "function openBot(i){",
    "  sel=CATALOG[i];",
    "  document.getElementById('me').textContent=sel.emoji;",
    "  document.getElementById('mt').textContent=sel.name;",
    "  document.getElementById('md').textContent=sel.desc;",
    "  document.getElementById('mpv').textContent=fmt(sel.price);",
    "  var fl='';for(var j=0;j<sel.feats.length;j++)fl+='<div class=\"mfi\"><span class=\"ck\">\\u2705</span>'+sel.feats[j]+'</div>';",
    "  document.getElementById('mfl').innerHTML=fl;",
    "  document.getElementById('req').value='';",
    "  document.getElementById('ov').classList.add('show');",
    "  if(tg&&tg.HapticFeedback)tg.HapticFeedback.impactOccurred('light');",
    "}",
    "function closeOv(e){if(e.target.id==='ov')closeModal();}",
    "function closeModal(){document.getElementById('ov').classList.remove('show');sel=null;}",
    "function placeOrder(){",
    "  if(!sel)return;",
    "  var req=document.getElementById('req').value.trim()||\"Ko'rsatilmagan\";",
    "  if(tg)tg.sendData(JSON.stringify({action:'order',botId:sel.id,botName:sel.name,price:sel.price,requirements:req}));",
    "  closeModal();",
    "  showToast('\\u2705 Buyurtma yuborildi!');",
    "}",
    "function showToast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},3000);}",
    "render();"
  ].join("\n");

  return `<!DOCTYPE html><html lang="uz"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BotMarket</title>
<script src="https://telegram.org/js/telegram-web-app.js"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0f0f1a;--card:#1a1a2e;--card2:#16213e;--purple:#7c3aed;--purple2:#a855f7;--blue:#3b82f6;--green:#10b981;--text:#e2e8f0;--muted:#94a3b8;--border:rgba(124,58,237,0.2)}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
.gbg{background:linear-gradient(135deg,#0f0f1a,#1a0533,#0a0a2e);position:fixed;inset:0;z-index:-1}
header{padding:20px 16px 0;text-align:center}
.logo{font-size:40px;margin-bottom:6px}
h1{font-size:26px;font-weight:900;background:linear-gradient(135deg,#a855f7,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
.sub{color:var(--muted);font-size:13px;margin-bottom:16px}
.stats{display:flex;justify-content:center;gap:16px;margin:0 16px 16px;padding:12px;background:var(--card);border-radius:16px;border:1px solid var(--border)}
.stat{text-align:center}
.sv{font-size:18px;font-weight:800;color:var(--purple2)}
.sl{font-size:10px;color:var(--muted);margin-top:2px}
.banner{margin:0 16px 16px;background:linear-gradient(135deg,rgba(16,185,129,.15),rgba(59,130,246,.15));border:1px solid rgba(16,185,129,.3);border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px}
.bi{font-size:28px}
.bt h3{font-size:14px;font-weight:700;color:var(--green);margin-bottom:2px}
.bt p{font-size:12px;color:var(--muted)}
.stitle{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;padding:0 16px;margin-bottom:10px}
.catalog{padding:0 16px;display:grid;gap:10px;margin-bottom:32px}
.bc{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:14px;cursor:pointer;position:relative;overflow:hidden;transition:transform .15s}
.bc:active{transform:scale(.98)}
.ct{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.ce{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--purple),var(--blue));display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.ci{flex:1;min-width:0}
.cn{font-size:14px;font-weight:700;margin-bottom:2px}
.cd{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cp{font-size:13px;font-weight:800;color:var(--purple2);white-space:nowrap}
.feats{display:flex;flex-wrap:wrap;gap:5px}
.feat{background:rgba(124,58,237,.15);border:1px solid rgba(124,58,237,.25);border-radius:6px;padding:2px 7px;font-size:10px;color:var(--purple2)}
.pb{position:absolute;top:10px;right:10px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;text-transform:uppercase}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:100;display:none;align-items:flex-end}
.ov.show{display:flex}
.modal{background:var(--card2);border-radius:24px 24px 0 0;width:100%;padding:20px 20px 40px;max-height:88vh;overflow-y:auto;animation:su .3s ease}
@keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
.mh{width:36px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;margin:0 auto 16px}
.me{font-size:48px;text-align:center;margin-bottom:10px}
.mt{font-size:22px;font-weight:900;text-align:center;margin-bottom:4px}
.md{color:var(--muted);text-align:center;margin-bottom:16px;font-size:13px}
.mp{background:linear-gradient(135deg,rgba(124,58,237,.2),rgba(59,130,246,.2));border:1px solid var(--border);border-radius:14px;padding:14px;text-align:center;margin-bottom:16px}
.mpl{font-size:11px;color:var(--muted);margin-bottom:4px}
.mpv{font-size:26px;font-weight:900;color:var(--purple2)}
.mf{margin-bottom:16px}
.mf h3{font-size:11px;font-weight:700;margin-bottom:8px;color:var(--muted);text-transform:uppercase}
.mfi{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);font-size:14px}
.mfi:last-child{border-bottom:none}
.ck{color:var(--green);font-size:15px;flex-shrink:0}
.rl{font-size:12px;color:var(--muted);margin-bottom:6px;display:block}
textarea{width:100%;background:var(--card);border:1px solid var(--border);border-radius:12px;color:var(--text);padding:12px;font-size:14px;min-height:90px;resize:none;margin-bottom:12px;font-family:inherit}
textarea:focus{outline:none;border-color:var(--purple2)}
textarea::placeholder{color:var(--muted)}
.bo{width:100%;padding:14px;background:linear-gradient(135deg,var(--purple),var(--blue));color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer}
.bc2{background:rgba(255,255,255,.06);color:var(--muted);border:none;border-radius:12px;padding:12px;font-size:14px;cursor:pointer;width:100%;margin-top:8px}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--green);color:#fff;padding:11px 22px;border-radius:20px;font-weight:600;font-size:14px;z-index:200;opacity:0;transition:opacity .3s;white-space:nowrap;pointer-events:none}
.toast.show{opacity:1}
</style></head><body>
<div class="gbg"></div>
<header><div class="logo">&#x1F916;</div><h1>BotMarket</h1><p class="sub">Professional Telegram Botlar Do'koni</p></header>
<div class="stats">
  <div class="stat"><div class="sv">10+</div><div class="sl">Bot turi</div></div>
  <div class="stat"><div class="sv">50K</div><div class="sl">Dan narx</div></div>
  <div class="stat"><div class="sv">7 kun</div><div class="sl">Bepul sinov</div></div>
  <div class="stat"><div class="sv">3-7</div><div class="sl">Kun bajarish</div></div>
</div>
<div class="banner"><div class="bi">&#x1F381;</div><div class="bt"><h3>Birinchi bot &#x2014; BEPUL!</h3><p>1 hafta bepul sinov. Server uchun to'lov keyinroq.</p></div></div>
<p class="stitle">Botlar Katalogi</p>
<div class="catalog" id="catalog"></div>
<div class="ov" id="ov" onclick="closeOv(event)">
  <div class="modal">
    <div class="mh"></div>
    <div class="me" id="me"></div><div class="mt" id="mt"></div><div class="md" id="md"></div>
    <div class="mp"><div class="mpl">Narx</div><div class="mpv" id="mpv"></div></div>
    <div class="mf"><h3>&#x2728; Imkoniyatlar</h3><div id="mfl"></div></div>
    <label class="rl">&#x1F4DD; Talablaringizni yozing (ixtiyoriy):</label>
    <textarea id="req" placeholder="Bot nima qilishi kerak?..."></textarea>
    <button class="bo" onclick="placeOrder()">&#x2705; Buyurtma berish</button>
    <button class="bc2" onclick="closeModal()">&#x2715; Yopish</button>
  </div>
</div>
<div class="toast" id="toast"></div>
<div style="height:20px"></div>
<script>${js}<\/script>
</body></html>`;
}

// ─── Express server ───────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));
app.get("/api/miniapp", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(getMiniAppHtml());
});

if (IS_PROD && WEBHOOK_URL) {
  const { webhookCallback } = await import("grammy");
  app.post("/api/webhook", webhookCallback(bot, "express"));
}

app.listen(PORT, async () => {
  console.log("Server listening on port", PORT);
  if (IS_PROD && WEBHOOK_URL) {
    await bot.api.setWebhook(WEBHOOK_URL);
    console.log("Webhook set:", WEBHOOK_URL);
  } else {
    await bot.api.deleteWebhook({ drop_pending_updates: true });
    void bot.start({ onStart: info => console.log("Bot started:", info.username) });
  }
  cron.schedule("0 9 * * *", async () => {
    const expired = getExpiredTrialUsers();
    for (const user of expired) {
      try {
        await bot.api.sendMessage(user.id,
          `⏰ <b>Sinov muddatingiz tugadi!</b>\n\nBotingiz to'xtatilmasligi uchun obunani yangilang:\n\n💰 Narx: <b>50,000 so'm/oy</b>\n🏦 Karta: <code>${PAYMENT_CARD}</code>\n👤 Ism: <b>${PAYMENT_NAME}</b>`,
          { parse_mode: "HTML" }
        );
        markNotified(user.id);
      } catch {}
    }
  });
});
