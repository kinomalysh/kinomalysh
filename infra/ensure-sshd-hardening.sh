#!/usr/bin/env bash
# Держит вход по SSH только по ключу.
#
# Ловушка, на которую мы наступили: в OpenSSH выигрывает ПЕРВОЕ вхождение ключа,
# а образ хостера кладёт /etc/ssh/sshd_config.d/50-cloud-init.conf с
# PasswordAuthentication yes. Наш 99-hardening.conf сортируется позже и молча
# проигрывает - в итоге на проде месяцами был включён вход по паролю, хотя
# провижининг его запрещал. Поэтому наш файл называется 00-, чтобы читаться
# первым.
#
# Заодно выключаем PerSourcePenalties: при входе только по ключу они не дают
# защиты, зато копят штраф на адрес и рубят соединения после серии обрывов.
set -euo pipefail

CONF=/etc/ssh/sshd_config.d/00-kinomalysh.conf
DESIRED='PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
PerSourcePenalties no
'

log() { printf '[sshd] %s\n' "$1"; }

if [ -f "$CONF" ] && [ "$(cat "$CONF")" = "$DESIRED" ]; then
  exit 0
fi

backup=""
if [ -f "$CONF" ]; then
  backup="$(mktemp)"
  sudo cp "$CONF" "$backup"
fi

printf '%s' "$DESIRED" | sudo tee "$CONF" >/dev/null

if ! sudo sshd -t; then
  if [ -n "$backup" ]; then
    sudo cp "$backup" "$CONF"
  else
    sudo rm -f "$CONF"
  fi
  log "конфиг не прошёл проверку, откатил - доступ не тронут"
  exit 0
fi

sudo systemctl reload ssh 2>/dev/null || sudo systemctl reload sshd
log "вход только по ключу, пароли и root закрыты"
