#!/usr/bin/env bash
# Разовая установка агента выкатки. Нужен один рабочий SSH-заход; после этого
# выкатка идёт через `infra/request-deploy.sh` и SSH больше не требуется.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$REPO_ROOT/infra/ssh-session.sh"
APP_DIR="${APP_DIR:-/srv/kinomalysh/app}"

step() { printf '\n\033[1;34m▸ %s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
die()  { printf '  \033[31m✗\033[0m %s\n' "$1"; exit 1; }

cd "$REPO_ROOT"

step "Связь с сервером"
ssh_session_open || die "нет SSH"
ok "канал есть"

step "Свежий код на сервере"
pssh "cd $APP_DIR && git fetch --quiet --tags --force origin && git reset --quiet --hard origin/main && chmod +x infra/deploy-agent.sh"
ok "агент на месте"

step "Systemd"
pscp -q infra/systemd/kinomalysh-deploy.service infra/systemd/kinomalysh-deploy.timer "$KM_HOST:/tmp/"
pssh "sudo install -m644 /tmp/kinomalysh-deploy.service /tmp/kinomalysh-deploy.timer /etc/systemd/system/ && \
      sudo install -d -o deploy -g deploy /srv/kinomalysh && \
      sudo systemctl daemon-reload && \
      sudo systemctl enable --now kinomalysh-deploy.timer"
ok "таймер включён, проверка раз в минуту"

step "Первая выкатка агентом"
pssh "sudo systemctl start kinomalysh-deploy.service" || true
pssh "journalctl -u kinomalysh-deploy -n 60 --no-pager" || true

printf '\n\033[1;32mАгент установлен\033[0m\n'
printf 'Дальше выкатка так: ./infra/request-deploy.sh - без SSH и без оглядки на VPN\n'
