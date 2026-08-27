#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-kinomalysh}"
APP_DIR="${APP_DIR:-/srv/kinomalysh/app}"
BRANCH="${BRANCH:-main}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

step() { printf '\n\033[1;34m▸ %s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
die()  { printf '  \033[31m✗\033[0m %s\n' "$1"; exit 1; }

cd "$REPO_ROOT"

step "Проверки перед выкаткой"
[ -z "$(git status --porcelain)" ] || die "есть незакоммиченные изменения"
npm test >/dev/null || die "тесты красные"
ok "дерево чистое, тесты зелёные"

step "Связь с сервером"
ssh -o ConnectTimeout=10 -o BatchMode=yes "$HOST" 'echo ok' >/dev/null \
  || die "нет SSH до $HOST (проверьте VPN и fail2ban)"
ok "$HOST отвечает"

step "Код и сборка бэкенда"
ssh "$HOST" "cd $APP_DIR && git fetch --quiet origin && git checkout --quiet $BRANCH && \
  git reset --quiet --hard origin/$BRANCH && \
  npm install --silent && \
  npm run build -w packages/shared -w packages/db -w packages/storage -w apps/api -w apps/worker" \
  || die "сборка на сервере упала"
ok "собрано из $BRANCH"

step "Миграции"
ssh "$HOST" "sudo bash -c 'set -a; . /etc/kinomalysh/db.env; set +a; \
  for f in $APP_DIR/infra/migrations/*.sql; do \
    echo \"  \$(basename \$f)\"; psql \"\$DATABASE_URL\" -q -v ON_ERROR_STOP=1 -f \"\$f\"; done'" \
  || die "миграции не применились"
ok "схема актуальна"

step "Сервисы"
ssh "$HOST" 'sudo systemctl restart kinomalysh-api kinomalysh-worker'
sleep 3
ssh "$HOST" 'systemctl is-active kinomalysh-api kinomalysh-worker' \
  || die "сервис не поднялся, смотрите journalctl -u kinomalysh-api -n 50"
ok "api и worker активны"

step "Ночной бэкап базы"
scp -q infra/systemd/kinomalysh-backup.service infra/systemd/kinomalysh-backup.timer "$HOST:/tmp/"
ssh "$HOST" 'sudo install -m644 /tmp/kinomalysh-backup.service /tmp/kinomalysh-backup.timer /etc/systemd/system/ && \
  sudo systemctl daemon-reload && sudo systemctl enable --now kinomalysh-backup.timer'
ok "таймер включён"

"$REPO_ROOT/infra/deploy-web.sh"
"$REPO_ROOT/infra/deploy-admin.sh"

step "Боевая проверка"
for check in "/api/health" "/api/catalog" "/api/payments/packs"; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' "https://kinomalysh.ru$check")"
  [ "$code" = "200" ] || die "$check отдаёт $code"
  printf '  %-22s %s\n' "$check" "$code"
done
ok "API отвечает через Caddy"

printf '\n\033[1;32mВыкатка завершена\033[0m\n'
