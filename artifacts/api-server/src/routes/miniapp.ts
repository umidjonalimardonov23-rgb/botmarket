import { Router } from "express";

const router = Router();

const HTML = `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BotMarket — Telegram Botlar Do'koni</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg: #0f0f1a; --card: #1a1a2e; --card2: #16213e;
    --purple: #7c3aed; --purple2: #a855f7; --blue: #3b82f6;
    --green: #10b981; --text: #e2e8f0; --muted: #94a3b8;
    --border: rgba(124,58,237,0.2);
  }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; overflow-x: hidden; }
  .gradient-bg { background: linear-gradient(135deg, #0f0f1a 0%, #1a0533 50%, #0a0a2e 100%); position: fixed; inset: 0; z-index: -1; }
  .orb { position: fixed; border-radius: 50%; filter: blur(80px); opacity: 0.15; z-index: -1; }
  .orb1 { width: 300px; height: 300px; background: #7c3aed; top: -100px; right: -100px; }
  .orb2 { width: 200px; height: 200px; background: #3b82f6; bottom: 100px; left: -50px; }
  header { padding: 20px 16px 0; text-align: center; }
  .logo { font-size: 40px; margin-bottom: 6px; }
  h1 { font-size: 26px; font-weight: 900; background: linear-gradient(135deg, #a855f7, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 4px; }
  .subtitle { color: var(--muted); font-size: 13px; margin-bottom: 16px; }
  .stats { display: flex; justify-content: center; gap: 16px; margin: 0 16px 16px; padding: 12px 16px; background: var(--card); border-radius: 16px; border: 1px solid var(--border); }
  .stat { text-align: center; }
  .stat-value { font-size: 18px; font-weight: 800; color: var(--purple2); }
  .stat-label { font-size: 10px; color: var(--muted); margin-top: 2px; }
  .free-banner { margin: 0 16px 16px; background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15)); border: 1px solid rgba(16,185,129,0.3); border-radius: 16px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
  .free-banner-icon { font-size: 28px; }
  .free-banner-text h3 { font-size: 14px; font-weight: 700; color: var(--green); margin-bottom: 2px; }
  .free-banner-text p { font-size: 12px; color: var(--muted); }
  .section-title { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; padding: 0 16px; margin-bottom: 10px; }
  .catalog { padding: 0 16px; display: grid; gap: 10px; margin-bottom: 32px; }
  .bot-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 14px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
  .bot-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(124,58,237,0.1), transparent); opacity: 0; transition: opacity 0.2s; }
  .bot-card:active::before { opacity: 1; }
  .bot-card:active { transform: scale(0.98); }
  .card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .card-emoji { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, var(--purple), var(--blue)); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .card-info { flex: 1; min-width: 0; }
  .card-name { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
  .card-desc { font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .card-price { font-size: 13px; font-weight: 800; color: var(--purple2); white-space: nowrap; }
  .features { display: flex; flex-wrap: wrap; gap: 5px; }
  .feature { background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.25); border-radius: 6px; padding: 2px 7px; font-size: 10px; color: var(--purple2); }
  .popular-badge { position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; text-transform: uppercase; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); z-index: 100; display: none; align-items: flex-end; }
  .modal-overlay.show { display: flex; }
  .modal { background: var(--card2); border-radius: 24px 24px 0 0; width: 100%; padding: 20px 20px 40px; max-height: 88vh; overflow-y: auto; animation: slideUp 0.3s ease; }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .modal-handle { width: 36px; height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; margin: 0 auto 16px; }
  .modal-emoji { font-size: 48px; text-align: center; margin-bottom: 10px; }
  .modal-title { font-size: 22px; font-weight: 900; text-align: center; margin-bottom: 4px; }
  .modal-desc { color: var(--muted); text-align: center; margin-bottom: 16px; font-size: 13px; }
  .modal-price { background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.2)); border: 1px solid var(--border); border-radius: 14px; padding: 14px; text-align: center; margin-bottom: 16px; }
  .modal-price-label { font-size: 11px; color: var(--muted); margin-bottom: 4px; }
  .modal-price-value { font-size: 26px; font-weight: 900; color: var(--purple2); }
  .modal-features { margin-bottom: 16px; }
  .modal-features h3 { font-size: 13px; font-weight: 700; margin-bottom: 8px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .modal-feature-item { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
  .modal-feature-item:last-child { border-bottom: none; }
  .check-icon { color: var(--green); font-size: 15px; flex-shrink: 0; }
  .req-label { font-size: 12px; color: var(--muted); margin-bottom: 6px; display: block; }
  textarea { width: 100%; background: var(--card); border: 1px solid var(--border); border-radius: 12px; color: var(--text); padding: 12px; font-size: 14px; min-height: 90px; resize: none; margin-bottom: 12px; font-family: inherit; }
  textarea:focus { outline: none; border-color: var(--purple2); }
  textarea::placeholder { color: var(--muted); }
  .btn-order { width: 100%; padding: 14px; background: linear-gradient(135deg, var(--purple), var(--blue)); color: white; border: none; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
  .btn-order:active { opacity: 0.85; }
  .btn-close { background: rgba(255,255,255,0.06); color: var(--muted); border: none; border-radius: 12px; padding: 12px; font-size: 14px; cursor: pointer; width: 100%; margin-top: 8px; }
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--green); color: white; padding: 11px 22px; border-radius: 20px; font-weight: 600; font-size: 14px; z-index: 200; opacity: 0; transition: opacity 0.3s; white-space: nowrap; pointer-events: none; }
  .toast.show { opacity: 1; }
  .pb { padding-bottom: 20px; }
</style>
</head>
<body>
<div class="gradient-bg"></div>
<div class="orb orb1"></div>
<div class="orb orb2"></div>

<header>
  <div class="logo">🤖</div>
  <h1>BotMarket</h1>
  <p class="subtitle">Professional Telegram Botlar Do'koni</p>
</header>

<div class="stats">
  <div class="stat"><div class="stat-value">10+</div><div class="stat-label">Bot turi</div></div>
  <div class="stat"><div class="stat-value">50K</div><div class="stat-label">Dan narx</div></div>
  <div class="stat"><div class="stat-value">7 kun</div><div class="stat-label">Bepul sinov</div></div>
  <div class="stat"><div class="stat-value">3-7</div><div class="stat-label">Kun bajarish</div></div>
</div>

<div class="free-banner">
  <div class="free-banner-icon">🎁</div>
  <div class="free-banner-text">
    <h3>Birinchi bot — BEPUL!</h3>
    <p>1 hafta bepul sinov. Server uchun to'lov keyinroq.</p>
  </div>
</div>

<p class="section-title">Botlar Katalogi</p>
<div class="catalog" id="catalog"></div>

<div class="modal-overlay" id="modal" onclick="closeModal(event)">
  <div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-emoji" id="modal-emoji"></div>
    <div class="modal-title" id="modal-title"></div>
    <div class="modal-desc" id="modal-desc"></div>
    <div class="modal-price">
      <div class="modal-price-label">Narx</div>
      <div class="modal-price-value" id="modal-price"></div>
    </div>
    <div class="modal-features">
      <h3>✨ Imkoniyatlar</h3>
      <div id="modal-features-list"></div>
    </div>
    <label class="req-label">📝 Talablaringizni yozing (ixtiyoriy):</label>
    <textarea id="requirements" placeholder="Bot nima qilishi kerak? Qanday funksiyalar kerak?..."></textarea>
    <button class="btn-order" onclick="placeOrder()">✅ Buyurtma berish</button>
    <button class="btn-close" onclick="closeModalBtn()">✕ Yopish</button>
  </div>
</div>

<div class="toast" id="toast"></div>
<div class="pb"></div>

<script>
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const CATALOG = [
  { id:'admin', name:'Admin Bot', emoji:'👨‍💼', price:50000, desc:"Guruh va kanal boshqaruvi", features:['Spam filter','Kicker/Banner','Ogohlantirish tizimi','Statistika'], popular:false },
  { id:'channel', name:'Kanal Bot', emoji:'📢', price:80000, desc:"Post yuborish, obuna tekshirish", features:['Auto post','Obuna tekshirish','Rejalashtirish','Statistika'], popular:false },
  { id:'form', name:'Ariza Bot', emoji:'📝', price:100000, desc:"Ma'lumot yig'ish, anketalar", features:['Forma yaratish','Javoblarni saqlash','Excel eksport','Admin xabarnoma'], popular:false },
  { id:'quiz', name:'Quiz Bot', emoji:'🎓', price:120000, desc:"Testlar va sertifikatlar", features:["Ko'p tanlovli savollar",'Ball tizimi','Sertifikat','Reyting jadvali'], popular:false },
  { id:'shop', name:"Do'kon Bot", emoji:'🛒', price:150000, desc:"Online savdo, katalog, to'lov", features:['Mahsulot katalogi','Savatcha',"To'lov tizimi",'Buyurtma boshqaruvi'], popular:true },
  { id:'booking', name:'Booking Bot', emoji:'📅', price:150000, desc:"Uchrashuv va xona bron qilish", features:['Kalendar','Bron tizimi','Eslatmalar','Bekor qilish'], popular:false },
  { id:'delivery', name:'Delivery Bot', emoji:'🚀', price:180000, desc:"Yetkazib berish tizimi", features:['Buyurtma qabul','Status kuzatish','Kuryer boshqaruvi','Xarita'], popular:false },
  { id:'game', name:"O'yin Bot", emoji:'🎮', price:200000, desc:"Mini o'yinlar va turnirlar", features:["Mini o'yinlar",'Turnir tizimi','Reyting','Mukofotlar'], popular:false },
  { id:'crm', name:'CRM Bot', emoji:'💼', price:250000, desc:"Mijozlar bazasi va hisobotlar", features:['Mijozlar bazasi','Hisobotlar','Funnel','Avtomatlashtirish'], popular:false },
  { id:'custom', name:'Custom Bot', emoji:'⚙️', price:0, desc:"Maxsus bot — narx kelishiladi", features:['To\'liq individual','Har qanday funksiya','Texnik yordam','Istalgan integratsiya'], popular:false },
];

function fmt(p) { return p ? p.toLocaleString('ru-RU') + " so'm" : 'Narx kelishiladi'; }

let sel = null;

document.getElementById('catalog').innerHTML = CATALOG.map(b => \`
  <div class="bot-card" onclick="open_('\${b.id}')">
    \${b.popular ? '<div class="popular-badge">🔥 Popular</div>' : ''}
    <div class="card-top">
      <div class="card-emoji">\${b.emoji}</div>
      <div class="card-info">
        <div class="card-name">\${b.name}</div>
        <div class="card-desc">\${b.desc}</div>
      </div>
      <div class="card-price">\${fmt(b.price)}</div>
    </div>
    <div class="features">\${b.features.map(f=>\`<span class="feature">\${f}</span>\`).join('')}</div>
  </div>
\`).join('');

function open_(id) {
  sel = CATALOG.find(b => b.id === id);
  if (!sel) return;
  document.getElementById('modal-emoji').textContent = sel.emoji;
  document.getElementById('modal-title').textContent = sel.name;
  document.getElementById('modal-desc').textContent = sel.desc;
  document.getElementById('modal-price').textContent = fmt(sel.price);
  document.getElementById('modal-features-list').innerHTML = sel.features
    .map(f => \`<div class="modal-feature-item"><span class="check-icon">✅</span>\${f}</div>\`).join('');
  document.getElementById('requirements').value = '';
  document.getElementById('modal').classList.add('show');
  tg?.HapticFeedback?.impactOccurred('light');
}

function closeModal(e) { if (e.target.id === 'modal') closeModalBtn(); }
function closeModalBtn() { document.getElementById('modal').classList.remove('show'); sel = null; }

function placeOrder() {
  if (!sel) return;
  const req = document.getElementById('requirements').value.trim() || "Ko'rsatilmagan";
  if (tg) {
    tg.sendData(JSON.stringify({ action:'order', botId:sel.id, botName:sel.name, price:sel.price, requirements:req }));
    tg.HapticFeedback?.notificationOccurred('success');
  }
  closeModalBtn();
  toast('✅ Buyurtma yuborildi!');
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
</script>
</body>
</html>`;

router.get("/miniapp", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(HTML);
});

export default router;
