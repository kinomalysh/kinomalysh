#!/usr/bin/env bash
# Выкатка, которую сервер делает сам.
#
# Зачем: до сервера с рабочей машины не всегда есть SSH - VPN рвёт соединение
# на 22 порт, и выкатка становится лотереей. Исходящий HTTPS до GitHub у сервера
# есть всегда, поэтому направление перевёрнуто: не мы толкаем код на сервер, а
# сервер забирает его сам.
#
# Выкатка не автоматическая. Агент реагирует только на движение тега `deploy`,
# то есть на явную команду человека, а не на каждый коммит в main.
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/kinomalysh/app}"
WEB_ROOT="${WEB_ROOT:-/srv/kinomalysh/web}"
ADMIN_ROOT="${ADMIN_ROOT:-/srv/kinomalysh/admin}"
STATE_FILE="${STATE_FILE:-/srv/kinomalysh/deployed-commit}"
LOCK_FILE=/tmp/kinomalysh-deploy.lock

exec 9>"$LOCK_FILE"
flock -n 9 || { echo "выкатка уже идёт, пропускаю"; exit 0; }

log() { printf '[%s] %s\n' "$(date '+%F %T')" "$1"; }

cd "$APP_DIR"

git fetch --quiet --tags --force origin
want="$(git rev-parse --quiet --verify 'refs/tags/deploy^{commit}' || true)"
if [ -z "$want" ]; then
  log "тега deploy нет, делать нечего"
  exit 0
fi

have="$(cat "$STATE_FILE" 2>/dev/null || true)"
if [ "$want" = "$have" ]; then
  exit 0
fi

log "начинаю выкатку $want"
git reset --quiet --hard "$want"

log "доступ по запасному порту"
bash "$APP_DIR/infra/ensure-ssh-alt-port.sh" || log "запасной порт настроить не удалось, продолжаю"
bash "$APP_DIR/infra/ensure-ssh-over-tls.sh" || log "SSH поверх TLS настроить не удалось, продолжаю"

log "зависимости"
npm install --silent --no-audit --no-fund

log "сборка бэкенда"
npm run build -w packages/shared -w packages/db -w packages/storage -w packages/book \
  -w apps/api -w apps/worker

log "миграции"
sudo bash -c 'set -a; . /etc/kinomalysh/db.env; set +a;
  for f in '"$APP_DIR"'/infra/migrations/*.sql; do
    echo "  $(basename "$f")"
    psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -f "$f"
  done'

log "сборка витрины"
npm run build -w apps/web -w apps/admin
[ -f apps/web/dist/index.html ] || { log "веб не собрался"; exit 1; }
[ -f apps/admin/dist/index.html ] || { log "админка не собралась"; exit 1; }

log "конфиг Caddy"
sudo install -m 644 infra/Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1 || {
  log "Caddyfile не прошёл валидацию"
  exit 1
}

log "выкладка статики"
sudo install -d -o deploy -g deploy -m 755 "$WEB_ROOT" "$ADMIN_ROOT"
rsync -a --delete apps/web/dist/ "$WEB_ROOT/"
rsync -a --delete apps/admin/dist/ "$ADMIN_ROOT/"
sudo chown -R caddy:caddy /var/log/caddy
sudo systemctl reload caddy

log "перезапуск сервисов"
sudo systemctl restart kinomalysh-api kinomalysh-worker
sleep 3
systemctl is-active kinomalysh-api kinomalysh-worker >/dev/null || {
  log "сервис не поднялся"
  exit 1
}

log "боевая проверка"
for p in /api/health /api/catalog /api/payments/packs; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "https://kinomalysh.ru$p" || echo 000)"
  log "  $p -> $code"
  [ "$code" = "200" ] || { log "проверка не прошла"; exit 1; }
done

echo "$want" | sudo tee "$STATE_FILE" >/dev/null
log "выкатка завершена: $want"
