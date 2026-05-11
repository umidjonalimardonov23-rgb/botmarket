# UzBOT Market

Telegram bot marketplace — foydalanuvchilar 10+ turdagi tayyor Telegram botlarni buyurtma qilishlari mumkin. Buyurtmalar adminning Telegram ga boradi.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server va Telegram botni ishga tushirish (port 8080)
- `pnpm run typecheck` — TypeScript tekshiruvi
- `pnpm run build` — to'liq build

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL (DATABASE_URL orqali)
- Bot: Telegraf
- Mini App: Telegram WebApp (HTML/CSS/JS)
- Build: esbuild (ESM bundle)

## Where things live

- `artifacts/api-server/src/bot/` — Telegram bot kodi (Telegraf)
- `artifacts/api-server/src/bot/database.ts` — PostgreSQL database logikasi
- `artifacts/api-server/src/bot/data.ts` — Bot katalogi ma'lumotlari
- `artifacts/api-server/src/bot/index.ts` — Bot handlers va startBot
- `artifacts/api-server/src/routes/webhook.ts` — /api/order va /api/bots endpointlari
- `artifacts/api-server/public/miniapp/index.html` — Telegram Mini App
- `railway.toml` — Railway deploy konfiguratsiyasi

## Environment Variables

- `BOT_TOKEN` — Telegram bot tokeni
- `ADMIN_ID` — Admin Telegram ID (7575930751)
- `MINI_APP_URL` — Mini app URL (Railway da domain bilan o'zgartiriladi)
- `DATABASE_URL` — PostgreSQL connection string (avtomatik o'rnatilgan)
- `PORT` — Server porti

## Architecture decisions

- Better-sqlite3 o'rniga PostgreSQL ishlatiladi (allaqachon mavjud DATABASE_URL orqali)
- Mini app HTML/CSS/JS da yaratilgan — framework shart emas, Telegram WebApp API bilan ishlaydi
- Bot polling rejimida ishlaydi (development va Railway da ham)
- Buyurtmalar to'g'ridan adminning Telegram ga boradi (inline button bilan)
- Mini app Express dan /miniapp path orqali serve qilinadi

## Railway Deploy

1. `railway.toml` allaqachon tayyor
2. Railway da yangi loyiha yarating va GitHub repo ga ulang
3. Environment variables qo'shing:
   - BOT_TOKEN, ADMIN_ID, DATABASE_URL (Railway PostgreSQL), PORT, MINI_APP_URL
4. MINI_APP_URL = `https://<railway-domain>/miniapp`

## Bot Features

- `/start` — Xush kelibsiz xabari + menyu
- `🛍 Botlar Do'koni` — Mini app orqali katalog
- `📦 Buyurtmalarim` — Foydalanuvchi buyurtmalari
- `👤 Profilim` — Profil + referral havola
- `💬 Bog'lanish` — Admin ma'lumotlari
- `ℹ️ Narxlar` — Narxlar ro'yxati
- `🔧 Admin Panel` — Admin uchun (faqat 7575930751)

## User preferences

- Bot token: BOT_TOKEN env var
- Admin ID: 7575930751
- Admin Telegram: @akaakayev8
- Railway deploy kerak
- Mini app pro dizayn bilan

## Gotchas

- MINI_APP_URL ni Railway domain bilan yangilash kerak deploy qilgandan keyin
- Bot Railway da ishlaganda MINI_APP_URL ni o'zgartiring
- PostgreSQL ssl = false development da, production da ssl: { rejectUnauthorized: false }
