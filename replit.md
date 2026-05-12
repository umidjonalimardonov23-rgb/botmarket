# BotMarket

Telegram bot marketplace mini app — foydalanuvchilar botlarni ko'rishi, baholashi va qo'shishi mumkin bo'lgan platforma.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080)
- `pnpm --filter @workspace/botmarket run dev` — Mini App frontend (port 21427)
- `pnpm run typecheck` — full typecheck
- `pnpm run build` — build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks
- `pnpm --filter @workspace/db run push` — push DB schema changes

Required env:
- `DATABASE_URL` — Postgres connection string
- `TELEGRAM_BOT_TOKEN` — Telegram bot token
- `MINI_APP_URL` — Mini App public URL for Telegram WebApp button

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind + shadcn/ui + framer-motion + zustand
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Bot: Telegram Bot API (webhook)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — DB schema (bots.ts, reviews.ts, categories.ts)
- `artifacts/api-server/src/routes/` — API routes (bots.ts, categories.ts, webhook.ts)
- `artifacts/botmarket/src/` — Mini App frontend
  - `pages/` — home, bots-list, bot-detail, profile, bot-new
  - `components/bot/BotCard.tsx` — bot card component
  - `hooks/use-theme.ts` — 8 color themes (zustand)
  - `hooks/use-language.ts` — 3 languages UZ/EN/RU (zustand)

## Product

- **Bot marketplace**: 15+ botlar, 10 kategoriya, izoh va baholash tizimi
- **Telegram Mini App**: Telegram ichida to'liq ishlaydigan web app
- **8 rang temasi**: Blue Ocean, Purple Galaxy, Green Forest, Orange Sunset, Rose Pink, Deep Navy, Teal Mint, Red Fire
- **3 til**: O'zbek, English, Русский
- **Telegram bot**: @UzBOTpro_bot — /start buyrug'i bilan mini app tugmasi

## User preferences

- O'zbek tilida muloqot
- Mobil-first dizayn (Telegram Mini App)
- Hamma joy O'zbek, Ingliz va Rus tillarida

## Gotchas

- Telegram webhook URL: `/api/webhook`
- Emoji icon length detection: use `/^\p{Emoji}/u.test()` not `.length <= 2`
- Bots routes: `stats` and `featured` must be defined BEFORE `/:id`
- After adding packages, restart the workflow

## Pointers

- See the `pnpm-workspace` skill for workspace structure
- Telegram Bot API docs: https://core.telegram.org/bots/api
