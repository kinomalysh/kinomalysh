#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-kinomalysh}"
ADMIN_ROOT="${ADMIN_ROOT:-/srv/kinomalysh/admin}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

step() { printf '\n\033[1;34m▸ %s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
die()  { printf '  \033[31m✗\033[0m %s\n' "$1"; exit 1; }

cd "$REPO_ROOT"

step "Сборка"
npm run build -w packages/shared
npm run build -w apps/admin
[ -f apps/admin/dist/index.html ] || die "сборка не дала dist/index.html"
ok "$(du -sh apps/admin/dist | cut -f1)"

step "Конфиг Caddy"
scp -q infra/Caddyfile "$HOST:/tmp/Caddyfile"
ssh "$HOST" "sudo install -m 644 /tmp/Caddyfile /etc/caddy/Caddyfile && sudo caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1" \
  || die "конфиг не прошёл валидацию, ничего не менял"
ok "валиден"

step "Выкладка"
ssh "$HOST" "sudo install -d -o deploy -g deploy -m 755 $ADMIN_ROOT"
rsync -az --delete -e ssh apps/admin/dist/ "$HOST:$ADMIN_ROOT/"
ssh "$HOST" "sudo chown -R caddy:caddy /var/log/caddy && sudo systemctl reload caddy"
ok "выложено, Caddy перезагружен"

step "Проверка"
code="$(curl -sS -o /dev/null -w '%{http_code}' "https://admin.kinomalysh.ru/")"
[ "$code" = "200" ] || die "админка отдаёт $code"
ok "админка отвечает 200"
