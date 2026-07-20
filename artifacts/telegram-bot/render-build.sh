#!/usr/bin/env bash
set -e

echo "=== pnpm o'rnatilmoqda ==="

# 1. Corepack orqali (Node 16.9+)
if command -v corepack &>/dev/null; then
  corepack enable pnpm 2>/dev/null && echo "corepack ok" || true
fi

# 2. Yo'q bo'lsa pnpm installer orqali
if ! command -v pnpm &>/dev/null; then
  export PNPM_HOME="$HOME/.local/share/pnpm"
  curl -fsSL https://get.pnpm.io/install.sh | sh -
  export PATH="$PNPM_HOME:$PATH"
fi

echo "pnpm version: $(pnpm --version)"

echo "=== Dependencylar o'rnatilmoqda ==="
pnpm install --frozen-lockfile

echo "=== Bot build qilinmoqda ==="
pnpm --filter @workspace/telegram-bot run build

echo "=== Build muvaffaqiyatli ==="
