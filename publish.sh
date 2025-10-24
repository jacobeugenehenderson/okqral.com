#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

git add -A
git commit -m "Manual update $(date +'%Y-%m-%d %H:%M:%S')" || true
git push origin main --force

echo "✅ okQRal updated and live at https://okqral.com"