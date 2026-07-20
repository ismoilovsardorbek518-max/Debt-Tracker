#!/usr/bin/env bash
set -e

cd artifacts/telegram-bot

echo "=== npm install (scripts o'tkazib yuboriladi) ==="
npm install --ignore-scripts

echo "=== Bot build ==="
node build.mjs

echo "=== Build muvaffaqiyatli ==="
