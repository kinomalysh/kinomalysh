#!/usr/bin/env bash
# Поднимает sshd дополнительно на 2222, не трогая 22.
#
# Зачем: потребительские VPN часто режут исходящий 22 как антиабузную меру. У нас
# это выглядело так: HTTPS через туннель проходит примерно в половине случаев, а
# SSH не проходит почти никогда. Высокий порт обычно не фильтруется.
#
# Скрипт идемпотентен и аддитивен: 22 остаётся, поэтому потерять доступ нельзя.
# Запускается агентом выкатки, то есть применяется без SSH.
set -euo pipefail

DROPIN=/etc/ssh/sshd_config.d/97-alt-port.conf
SOCKET_DIR=/etc/systemd/system/ssh.socket.d
SOCKET_OVERRIDE="$SOCKET_DIR/override.conf"

log() { printf '[ssh-alt] %s\n' "$1"; }

# Ubuntu с некоторых версий слушает SSH через сокет systemd, и тогда директива
# Port в sshd_config молча игнорируется - порт задаётся в самом сокете.
if systemctl is-enabled ssh.socket >/dev/null 2>&1; then
  desired=$'[Socket]\nListenStream=\nListenStream=22\nListenStream=2222\n'
  if [ -f "$SOCKET_OVERRIDE" ] && [ "$(cat "$SOCKET_OVERRIDE")" = "$desired" ]; then
    log "сокет уже настроен"
  else
    sudo install -d -m 755 "$SOCKET_DIR"
    printf '%s' "$desired" | sudo tee "$SOCKET_OVERRIDE" >/dev/null
    sudo systemctl daemon-reload
    sudo systemctl restart ssh.socket
    log "сокет слушает 22 и 2222"
  fi
else
  desired=$'Port 22\nPort 2222\n'
  if [ -f "$DROPIN" ] && [ "$(cat "$DROPIN")" = "$desired" ]; then
    log "конфиг уже настроен"
  else
    printf '%s' "$desired" | sudo tee "$DROPIN" >/dev/null
    if ! sudo sshd -t; then
      sudo rm -f "$DROPIN"
      log "конфиг не прошёл проверку, откатил - доступ на 22 не тронут"
      exit 0
    fi
    sudo systemctl reload ssh 2>/dev/null || sudo systemctl reload sshd
    log "sshd слушает 22 и 2222"
  fi
fi

sudo ufw allow 2222/tcp >/dev/null 2>&1 || true
log "готово"
