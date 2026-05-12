# Railway Deployment Guide

## Qadam 1 — GitHub repo yarating

1. https://github.com/new ga boring
2. Repository nomi: `botmarket`
3. Public yoki Private tanlang
4. **"Create repository"** ni bosing
5. Ochilgan sahifada `HTTPS` URL ni nusxalang:
   `https://github.com/SIZNING_USERNAME/botmarket.git`

## Qadam 2 — Kodni GitHub ga yuboring

Replit da **Shell** ni oching va quyidagilarni kiriting:

```bash
git remote add github https://github.com/SIZNING_USERNAME/botmarket.git
git push github main
```

> Token so'rasa: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic), "repo" ni belgilang

## Qadam 3 — Railway da yarating

1. https://railway.app ga boring → **Login with GitHub**
2. **"New Project"** → **"Deploy from GitHub repo"**
3. `botmarket` ni tanlang
4. **"Deploy Now"** bosing

## Qadam 4 — PostgreSQL qo'shing

1. Railway projectingizda **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. PostgreSQL qo'shilgach, u avtomatik `DATABASE_URL` o'zgaruvchisini beradi

## Qadam 5 — Environment Variables

Railway → Sizning servisingiz → **Variables** bo'limiga quyidagilarni qo'shing:

```
TELEGRAM_BOT_TOKEN = <BotFather dan olgan token>
MINI_APP_URL       = https://<railway-domain>.railway.app
SESSION_SECRET     = <xavfsiz tasodifiy so'z>
```

> `MINI_APP_URL` ni deploy bo'lgach Railway bergan domen bilan yangilang

## Qadam 6 — DB migratsiyasini ishga tushiring

Railway → Servis → **"Railway Shell"** yoki lokal terminaldan:

```bash
DATABASE_URL=<railway_postgres_url> pnpm --filter @workspace/db run push
```

## Qadam 7 — Telegram webhook ni yangilang

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<railway-domain>.railway.app/api/webhook
```

## Qadam 8 — MINI_APP_URL ni yangilang

Railway Variables da `MINI_APP_URL` ni Railway domeingiz bilan yangilang, keyin **Redeploy** bosing.
