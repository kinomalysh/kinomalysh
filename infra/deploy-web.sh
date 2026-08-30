#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT_SSH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$REPO_ROOT_SSH/infra/ssh-session.sh"
ssh_session_open || { echo "нет SSH"; exit 1; }
WEB_ROOT="${WEB_ROOT:-/srv/kinomalysh/web}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

step() { printf '\n\033[1;34m▸ %s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
die()  { printf '  \033[31m✗\033[0m %s\n' "$1"; exit 1; }

cd "$REPO_ROOT"

step "Сборка"
npm run build -w packages/shared
npm run build -w apps/web
[ -f apps/web/dist/index.html ] || die "сборка не дала dist/index.html"
ok "$(find apps/web/dist -name '*.html' | wc -l | tr -d ' ') HTML, $(du -sh apps/web/dist | cut -f1)"

step "Конфиг Caddy"
pscp -q infra/Caddyfile "$KM_HOST:/tmp/Caddyfile"
pssh "sudo install -m 644 /tmp/Caddyfile /etc/caddy/Caddyfile && sudo caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1" \
  || die "конфиг не прошёл валидацию, ничего не менял"
ok "валиден"

step "Выкладка"
pssh "sudo install -d -o deploy -g deploy -m 755 $WEB_ROOT"
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" apps/web/dist/ "$KM_HOST:$WEB_ROOT/"
pssh "sudo chown -R caddy:caddy /var/log/caddy && sudo systemctl reload caddy"
ok "выложено, Caddy перезагружен"

step "Проверка"
for p in / /create /blog /terms; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' "https://kinomalysh.ru$p")"
  [ "$code" = "200" ] || die "$p отдаёт $code"
  printf '  %-12s %s\n' "$p" "$code"
done
ok "сайт отвечает"
