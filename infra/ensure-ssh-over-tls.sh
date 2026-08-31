#!/usr/bin/env bash
# Заворачивает SSH в TLS, чтобы он проходил через VPN.
#
# Механизм проблемы: в SSH первым говорит СЕРВЕР - шлёт баннер версии до любых
# данных от клиента. Туннели, которые разбирают трафик по SNI, буферизуют
# соединение в ожидании клиентского payload, не дожидаются и рвут связь. Поэтому
# TCP встаёт, а обмен баннерами не происходит - и так на любом порту.
# В HTTPS первым говорит клиент, поэтому он через тот же туннель проходит.
#
# Решение: stunnel принимает TLS и проксирует в локальный sshd. Клиент шлёт
# ClientHello первым, туннель доволен, дальше внутри идёт обычный SSH со своей
# аутентификацией по ключу.
#
# Безопасность: снаружи это ещё одна дверь в тот же sshd, где вход только по
# ключу, root закрыт, пароли отключены. Новых прав не появляется.
set -euo pipefail

PORT=8443
CONF=/etc/stunnel/ssh-tls.conf
CERT=/etc/stunnel/ssh-tls.pem

log() { printf '[ssh-tls] %s\n' "$1"; }

if ! command -v stunnel4 >/dev/null 2>&1 && ! command -v stunnel >/dev/null 2>&1; then
  log "ставлю stunnel"
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq stunnel4 >/dev/null 2>&1 || {
    log "не удалось поставить stunnel, пропускаю"
    exit 0
  }
fi

if [ ! -f "$CERT" ]; then
  log "генерирую сертификат"
  sudo openssl req -new -x509 -days 3650 -nodes -subj '/CN=kinomalysh-ssh' \
    -out /tmp/ssh-tls.pem -keyout /tmp/ssh-tls.key >/dev/null 2>&1
  sudo bash -c 'cat /tmp/ssh-tls.key /tmp/ssh-tls.pem > '"$CERT"
  sudo chmod 600 "$CERT"
  sudo rm -f /tmp/ssh-tls.key /tmp/ssh-tls.pem
fi

desired="[ssh-tls]
accept = ${PORT}
connect = 127.0.0.1:22
cert = ${CERT}
"
if [ ! -f "$CONF" ] || [ "$(cat "$CONF")" != "$desired" ]; then
  printf '%s' "$desired" | sudo tee "$CONF" >/dev/null
  log "конфиг записан"
fi

sudo sed -i 's/^ENABLED=0/ENABLED=1/' /etc/default/stunnel4 2>/dev/null || true
sudo ufw allow ${PORT}/tcp >/dev/null 2>&1 || true
sudo systemctl enable stunnel4 >/dev/null 2>&1 || true
sudo systemctl restart stunnel4 >/dev/null 2>&1 || sudo systemctl restart stunnel >/dev/null 2>&1 || {
  log "stunnel не запустился"
  exit 0
}

sleep 1
if sudo ss -lntp 2>/dev/null | grep -q ":${PORT}"; then
  log "SSH поверх TLS слушает на ${PORT}"
else
  log "порт ${PORT} не поднялся"
fi
