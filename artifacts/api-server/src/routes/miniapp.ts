import { Router } from "express";

const router = Router();

router.get("/miniapp", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(getHtml());
});

function getHtml(): string {
  const css = `
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0f0f1a;--card:#1a1a2e;--card2:#16213e;--purple:#7c3aed;--purple2:#a855f7;--blue:#3b82f6;--green:#10b981;--text:#e2e8f0;--muted:#94a3b8;--border:rgba(124,58,237,0.2)}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden}
.gbg{background:linear-gradient(135deg,#0f0f1a 0%,#1a0533 50%,#0a0a2e 100%);position:fixed;inset:0;z-index:-1}
.orb{position:fixed;border-radius:50%;filter:blur(80px);opacity:.15;z-index:-1}
.o1{width:300px;height:300px;background:#7c3aed;top:-100px;right:-100px}
.o2{width:200px;height:200px;background:#3b82f6;bottom:100px;left:-50px}
header{padding:20px 16px 0;text-align:center}
.logo{font-size:40px;margin-bottom:6px}
h1{font-size:26px;font-weight:900;background:linear-gradient(135deg,#a855f7,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
.sub{color:var(--muted);font-size:13px;margin-bottom:16px}
.stats{display:flex;justify-content:center;gap:16px;margin:0 16px 16px;padding:12px 16px;background:var(--card);border-radius:16px;border:1px solid var(--border)}
.stat{text-align:center}
.sv{font-size:18px;font-weight:800;color:var(--purple2)}
.sl{font-size:10px;color:var(--muted);margin-top:2px}
.banner{margin:0 16px 16px;background:linear-gradient(135deg,rgba(16,185,129,.15),rgba(59,130,246,.15));border:1px solid rgba(16,185,129,.3);border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px}
.bi{font-size:28px}
.bt h3{font-size:14px;font-weight:700;color:var(--green);margin-bottom:2px}
.bt p{font-size:12px;color:var(--muted)}
.stitle{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;padding:0 16px;margin-bottom:10px}
.catalog{padding:0 16px;display:grid;gap:10px;margin-bottom:32px}
.bc{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:14px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden}
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
.mf h3{font-size:11px;font-weight:700;margin-bottom:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}
.mfi{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);font-size:14px}
.mfi:last-child{border-bottom:none}
.ck{color:var(--green);font-size:15px;flex-shrink:0}
.rl{font-size:12px;color:var(--muted);margin-bottom:6px;display:block}
textarea{width:100%;background:var(--card);border:1px solid var(--border);border-radius:12px;color:var(--text);padding:12px;font-size:14px;min-height:90px;resize:none;margin-bottom:12px;font-family:inherit}
textarea:focus{outline:none;border-color:var(--purple2)}
textarea::placeholder{color:var(--muted)}
.bo{width:100%;padding:14px;background:linear-gradient(135deg,var(--purple),var(--blue));color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;transition:opacity .2s}
.bo:active{opacity:.85}
.bc2{background:rgba(255,255,255,.06);color:var(--muted);border:none;border-radius:12px;padding:12px;font-size:14px;cursor:pointer;width:100%;margin-top:8px}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--green);color:#fff;padding:11px 22px;border-radius:20px;font-weight:600;font-size:14px;z-index:200;opacity:0;transition:opacity .3s;white-space:nowrap;pointer-events:none}
.toast.show{opacity:1}
`;

  const js = `
var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); }

var CATALOG = [
  {id:'admin',  name:'Admin Bot',    emoji:'👨‍💼', price:50000,  desc:"Guruh va kanal boshqaruvi",         feats:['Spam filter','Kicker/Banner','Ogohlantirish','Statistika'],            pop:false},
  {id:'channel',name:'Kanal Bot',    emoji:'📢',  price:80000,  desc:"Post yuborish, obuna tekshirish",   feats:['Auto post','Obuna tekshirish','Rejalashtirish','Statistika'],         pop:false},
  {id:'form',   name:'Ariza Bot',    emoji:'📝',  price:100000, desc:"Ma'lumot yig'ish, anketalar",       feats:['Forma yaratish','Javoblarni saqlash','Excel eksport','Xabarnoma'],     pop:false},
  {id:'quiz',   name:'Quiz Bot',     emoji:'🎓',  price:120000, desc:"Testlar va sertifikatlar",          feats:["Ko'p tanlovli savol",'Ball tizimi','Sertifikat','Reyting'],            pop:false},
  {id:'shop',   name:"Do'kon Bot",   emoji:'🛒',  price:150000, desc:"Online savdo, katalog, to'lov",     feats:['Mahsulot katalog','Savatcha',"To'lov tizimi",'Buyurtma'],             pop:true},
  {id:'booking',name:'Booking Bot',  emoji:'📅',  price:150000, desc:"Uchrashuv va xona bron qilish",     feats:['Kalendar','Bron tizimi','Eslatmalar','Bekor qilish'],                 pop:false},
  {id:'delivery',name:'Delivery Bot',emoji:'🚀',  price:180000, desc:"Yetkazib berish tizimi",            feats:['Buyurtma qabul','Status','Kuryer','Xarita'],                          pop:false},
  {id:'game',   name:"O'yin Bot",    emoji:'🎮',  price:200000, desc:"Mini o'yinlar va turnirlar",        feats:["Mini o'yinlar",'Turnir','Reyting','Mukofot'],                         pop:false},
  {id:'crm',    name:'CRM Bot',      emoji:'💼',  price:250000, desc:"Mijozlar bazasi va hisobotlar",     feats:['Mijozlar bazasi','Hisobotlar','Funnel','Avtomatlashtirish'],          pop:false},
  {id:'custom', name:'Custom Bot',   emoji:'⚙️',  price:0,      desc:"Maxsus bot, narx kelishiladi",      feats:['To\'liq individual','Har qanday','Yordam','Istalgan'],               pop:false}
];

function fmt(p) {
  if (!p) return "Narx kelishiladi";
  return p.toLocaleString('ru-RU') + " so'm";
}

function renderCatalog() {
  var el = document.getElementById('catalog');
  var html = '';
  for (var i = 0; i < CATALOG.length; i++) {
    var b = CATALOG[i];
    var featsHtml = '';
    for (var j = 0; j < b.feats.length; j++) {
      featsHtml += '<span class="feat">' + b.feats[j] + '</span>';
    }
    html += '<div class="bc" onclick="openBot(' + i + ')">';
    if (b.pop) html += '<div class="pb">🔥 Popular</div>';
    html += '<div class="ct">';
    html += '<div class="ce">' + b.emoji + '</div>';
    html += '<div class="ci"><div class="cn">' + b.name + '</div><div class="cd">' + b.desc + '</div></div>';
    html += '<div class="cp">' + fmt(b.price) + '</div>';
    html += '</div>';
    html += '<div class="feats">' + featsHtml + '</div>';
    html += '</div>';
  }
  el.innerHTML = html;
}

var sel = null;

function openBot(idx) {
  sel = CATALOG[idx];
  document.getElementById('me').textContent = sel.emoji;
  document.getElementById('mt').textContent = sel.name;
  document.getElementById('md').textContent = sel.desc;
  document.getElementById('mpv').textContent = fmt(sel.price);
  var fl = '';
  for (var i = 0; i < sel.feats.length; i++) {
    fl += '<div class="mfi"><span class="ck">✅</span>' + sel.feats[i] + '</div>';
  }
  document.getElementById('mfl').innerHTML = fl;
  document.getElementById('req').value = '';
  document.getElementById('ov').classList.add('show');
  if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

function closeOv(e) { if (e.target.id === 'ov') closeModal(); }
function closeModal() { document.getElementById('ov').classList.remove('show'); sel = null; }

function placeOrder() {
  if (!sel) return;
  var req = document.getElementById('req').value.trim() || "Ko'rsatilmagan";
  if (tg) {
    tg.sendData(JSON.stringify({action:'order',botId:sel.id,botName:sel.name,price:sel.price,requirements:req}));
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
  }
  closeModal();
  showToast('✅ Buyurtma yuborildi!');
}

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3000);
}

renderCatalog();
`;

  return [
    '<!DOCTYPE html><html lang="uz"><head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>BotMarket</title>',
    '<script src="https://telegram.org/js/telegram-web-app.js"></scr' + 'ipt>',
    '<style>', css, '</style>',
    '</head><body>',
    '<div class="gbg"></div><div class="orb o1"></div><div class="orb o2"></div>',
    '<header><div class="logo">🤖</div><h1>BotMarket</h1><p class="sub">Professional Telegram Botlar Do\'koni</p></header>',
    '<div class="stats">',
    '  <div class="stat"><div class="sv">10+</div><div class="sl">Bot turi</div></div>',
    '  <div class="stat"><div class="sv">50K</div><div class="sl">Dan narx</div></div>',
    '  <div class="stat"><div class="sv">7 kun</div><div class="sl">Bepul sinov</div></div>',
    '  <div class="stat"><div class="sv">3-7</div><div class="sl">Kun bajarish</div></div>',
    '</div>',
    '<div class="banner"><div class="bi">🎁</div><div class="bt"><h3>Birinchi bot — BEPUL!</h3><p>1 hafta bepul sinov. Server uchun to\'lov keyinroq.</p></div></div>',
    '<p class="stitle">Botlar Katalogi</p>',
    '<div class="catalog" id="catalog"></div>',
    '<div class="ov" id="ov" onclick="closeOv(event)">',
    '  <div class="modal">',
    '    <div class="mh"></div>',
    '    <div class="me" id="me"></div>',
    '    <div class="mt" id="mt"></div>',
    '    <div class="md" id="md"></div>',
    '    <div class="mp"><div class="mpl">Narx</div><div class="mpv" id="mpv"></div></div>',
    '    <div class="mf"><h3>✨ Imkoniyatlar</h3><div id="mfl"></div></div>',
    '    <label class="rl">📝 Talablaringizni yozing (ixtiyoriy):</label>',
    '    <textarea id="req" placeholder="Bot nima qilishi kerak? Qanday funksiyalar kerak?..."></textarea>',
    '    <button class="bo" onclick="placeOrder()">✅ Buyurtma berish</button>',
    '    <button class="bc2" onclick="closeModal()">✕ Yopish</button>',
    '  </div>',
    '</div>',
    '<div class="toast" id="toast"></div>',
    '<div style="height:20px"></div>',
    '<script>', js, '</scr' + 'ipt>',
    '</body></html>',
  ].join('\n');
}

export default router;
