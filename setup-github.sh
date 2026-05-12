#!/bin/bash
# GitHub ga push qilish skripti
# Ishlatish: bash setup-github.sh https://github.com/USERNAME/botmarket.git

GITHUB_URL=$1

if [ -z "$GITHUB_URL" ]; then
  echo "❌ GitHub URL ni bering!"
  echo "Ishlatish: bash setup-github.sh https://github.com/USERNAME/botmarket.git"
  exit 1
fi

echo "🔗 GitHub remote qo'shilmoqda..."
git remote remove github 2>/dev/null || true
git remote add github "$GITHUB_URL"

echo "📦 Hamma o'zgarishlar commit qilinmoqda..."
git add -A
git commit -m "Railway deployment setup" --allow-empty

echo "🚀 GitHub ga push qilinmoqda..."
git push github main

echo ""
echo "✅ GitHub ga yuklandi!"
echo ""
echo "Keyingi qadam:"
echo "1. https://railway.app ga boring"
echo "2. 'New Project' → 'Deploy from GitHub repo' → botmarket"
echo "3. PostgreSQL plugin qo'shing"
echo "4. Environment variables qo'shing (TELEGRAM_BOT_TOKEN, MINI_APP_URL, SESSION_SECRET)"
