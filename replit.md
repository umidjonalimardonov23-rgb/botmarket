# BotMarket

Professional Telegram botlar buyurtma qilish platformasi. Foydalanuvchilar bot tanlaydi, buyurtma beradi, admin xabardor bo'ladi.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server + Telegram bot (port 8080)
- `pnpm --filter @workspace/mini-app run dev` — Mini App frontend (port 18801)
- `pnpm run typecheck` — full typecheck
- `pnpm run build` — typecheck + build
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Telegraf (Telegram bot)
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + Tailwind CSS + Framer Motion
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (OpenAPI spec)
- Build: esbuild (CJS bundle)
- Cron: node-cron (weekly trial expiry reminders)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/index.ts` — DB schema (bot_types, orders, telegram_users)
- `artifacts/api-server/src/lib/bot.ts` — Telegram bot logic (Telegraf)
- `artifacts/api-server/src/routes/` — API routes
- `artifacts/mini-app/src/` — React Mini App frontend

## Architecture decisions

- Bot runs in polling mode (long-polling) on the same Express server
- Weekly trial expiry cron job runs at 9:00 AM daily
- Mini App URL configured via MINI_APP_URL env var
- Admin notifications sent via sendAdminNotification() function
- Referral codes stored per user as `ref_{telegramId}_{timestamp}`

## Product

- Users can browse bot catalog (10+ types), order via Mini App or bot
- 1 free bot trial for 1 week, then server payment reminder (50,000 so'm/month)
- All orders go to admin (Telegram ID: 7575930751)
- Referral system with unique ref links
- Admin can manage order statuses via bot inline buttons

## User preferences

- Payment card: 9860606760806673 (Alimardonov Umidjon)
- Admin ID: 7575930751
- Bot prices start from 50,000 so'm
- Platform language: Uzbek
- Deploy target: Railway via GitHub

## Gotchas

- BOT_TOKEN, ADMIN_ID, RAILWAY_TOKEN, GITHUB_TOKEN must be set as secrets
- MINI_APP_URL must point to the deployed URL for Telegram WebApp button to work
- After DB schema changes: `pnpm --filter @workspace/db run push`
- After OpenAPI changes: `pnpm --filter @workspace/api-spec run codegen`

## Railway Deploy

Set these env vars in Railway:
- `DATABASE_URL` — PostgreSQL connection string
- `BOT_TOKEN` — Telegram bot token
- `ADMIN_ID` — Admin Telegram ID
- `MINI_APP_URL` — Deployed Mini App URL
- `PORT` — 8080

## Pointers

- See the `pnpm-workspace` skill for workspace structure details
