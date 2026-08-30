#!/usr/bin/env bash
# Поднимает мультиплексированный SSH-канал до прода и держит его на время выкатки.
#
# Важно: sshd на сервере считает штраф за каждое соединение, закрытое без
# аутентификации (PerSourcePenalties, OpenSSH 9.8+). Частые ретраи не пробивают
# связь, а наращивают штраф и делают хуже. Поэтому попыток мало, пауза между
# ними растёт, и всё дальнейшее идёт через один уже поднятый канал.
set -euo pipefail

KM_HOST="${KM_HOST:-kinomalysh}"
CONTROL_PATH="${CONTROL_PATH:-$HOME/.ssh/cm-kinomalysh-deploy}"

SSH_OPTS=(
  -o ControlMaster=auto
  -o "ControlPath=$CONTROL_PATH"
  -o ControlPersist=30m
  -o ConnectTimeout=15
  -o ServerAliveInterval=15
  -o ServerAliveCountMax=6
)

BACKOFF=(5 15 30 60 60 120)

pssh() { ssh "${SSH_OPTS[@]}" "$KM_HOST" "$@"; }
pscp() { scp "${SSH_OPTS[@]}" "$@"; }

ssh_session_up() {
  ssh -o "ControlPath=$CONTROL_PATH" -O check "$KM_HOST" >/dev/null 2>&1
}

ssh_session_open() {
  ssh_session_up && return 0
  local i=0 wait
  for wait in 0 "${BACKOFF[@]}"; do
    [ "$wait" -gt 0 ] && sleep "$wait"
    i=$((i + 1))
    if ssh "${SSH_OPTS[@]}" -o BatchMode=yes -fN "$KM_HOST" 2>/dev/null && ssh_session_up; then
      [ "$i" -gt 1 ] && printf '  канал поднят с попытки %d\n' "$i"
      return 0
    fi
  done
  printf '  нет SSH до %s после %d попыток.\n' "$KM_HOST" "$i" >&2
  printf '  Не запускайте выкатку повторно сразу - каждая неудачная попытка\n' >&2
  printf '  продлевает штраф sshd. Подождите 10 минут и повторите.\n' >&2
  return 1
}

ssh_session_close() {
  ssh -o "ControlPath=$CONTROL_PATH" -O exit "$KM_HOST" >/dev/null 2>&1 || true
}
