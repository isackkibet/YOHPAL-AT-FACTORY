#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting everything (infra + backend via PM2 + Admin + Flutter web)..."

cd "$ROOT_DIR"

# --- Ensure docker infra ---
echo "🧱 Starting Docker infra (Postgres/Redis/Zookeeper/Kafka)..."
docker compose -f infra/docker-compose.yml up -d

# --- Ensure PM2 exists ---
if ! command -v pm2 >/dev/null 2>&1; then
  echo "❌ pm2 not found. Install with: sudo npm install -g pm2"
  exit 1
fi

# --- Start backend (PM2) ---
echo "⚙️  Starting backend services (PM2) using ecosystem.config.js..."

# Avoid duplicates if script is re-run
pm2 describe ecosystem.config.js >/dev/null 2>&1 || true
pm2 delete all >/dev/null 2>&1 || true

pm2 start ecosystem.config.js
pm2 save

# --- Start Admin Dashboard ---
echo "🧑‍💻 Starting Admin Web (Next.js)..."
cd "$ROOT_DIR/apps/admin_web"
rm -rf .next
npm install --silent >/dev/null 2>&1 || true
npm run dev &
ADMIN_PID=$!
cd "$ROOT_DIR"

# --- Start Flutter (web-server) ---
echo "📱 Starting Flutter Web Server (web-server port 5002)..."
cd "$ROOT_DIR/apps/mobile_flutter"
flutter pub get >/dev/null 2>&1 || true
flutter run -d web-server \
  --web-port 5002 \
  --web-hostname 0.0.0.0 \
  --dart-define=API_BASE_URL=http://127.0.0.1:3000 &
FLUTTER_PID=$!
cd "$ROOT_DIR"

echo "✅ All started!"

echo "Admin: (see Next.js dev output in this terminal)"
echo "Flutter: http://localhost:5002"
echo "Backend (gateway): check http://127.0.0.1:3000 (or review PM2 logs below)"

echo "--- Backend logs (PM2) ---"
pm2 logs --lines 50 --raw &

# Keep script alive so background processes don't get killed in some shells
wait $ADMIN_PID $FLUTTER_PID || true

