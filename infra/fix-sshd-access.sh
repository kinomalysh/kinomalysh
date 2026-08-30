#!/usr/bin/env bash
# Убирает причину, по которой SSH до прода терял половину соединений:
# PerSourcePenalties (OpenSSH 9.8+) копил штраф на исходящий IP и рубил
# соединения сразу после accept, а узкий MaxStartups добивал остальное.
#
# Скрипт идемпотентен и защищён от потери доступа: конфиг проверяется через
# sshd -t, перед перезагрузкой ставится таймер автоотката, и таймер снимается
# только после успешного НОВОГО соединения с клиента.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$REPO_ROOT/infra/ssh-session.sh"

DROPIN=/etc/ssh/sshd_config.d/98-access.conf
ROLLBACK_UNIT=sshd-access-rollback

step() { printf '\n\033[1;34m▸ %s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
die()  { printf '  \033[31m✗\033[0m %s\n' "$1"; exit 1; }

step "Канал до сервера"
ssh_session_open || die "нет SSH, повторите через 10 минут"
ok "канал есть"

step "Что на сервере сейчас"
pssh 'echo "  OpenSSH: $(sshd -V 2>&1 | head -1 || ssh -V 2>&1)"
      echo "  MaxStartups: $(sudo sshd -T 2>/dev/null | grep -i "^maxstartups" | cut -d" " -f2-)"
      echo "  PerSourcePenalties: $(sudo sshd -T 2>/dev/null | grep -i "^persourcepenalties" | cut -d" " -f2- || echo "не поддерживается")"'

step "Новый конфиг"
pssh "sudo bash -s" <<'REMOTE'
set -euo pipefail
DROPIN=/etc/ssh/sshd_config.d/98-access.conf

# PerSourcePenalties есть только в OpenSSH 9.8+ - на старых sshd -t упадёт
# на неизвестной директиве, поэтому добавляем её только если она поддерживается.
if sshd -T 2>/dev/null | grep -qi '^persourcepenalties'; then
  PENALTY_LINE='PerSourcePenalties no'
else
  PENALTY_LINE='# PerSourcePenalties не поддерживается этой версией OpenSSH'
fi

[ -f "$DROPIN" ] && cp -a "$DROPIN" "$DROPIN.bak"

cat > "$DROPIN" <<EOF
# Доступ для выкатки. Ключи обязательны, пароли и root уже закрыты в
# 99-hardening.conf, поэтому штрафовать источники смысла нет - зато штраф
# рубил наши собственные деплои.
$PENALTY_LINE
MaxStartups 100:30:200
LoginGraceTime 30
EOF

sshd -t
echo "  конфиг валиден"
REMOTE
ok "drop-in записан и проверен"

step "Страховка от потери доступа"
pssh "sudo systemd-run --unit=$ROLLBACK_UNIT --on-active=300 \
        /bin/bash -c 'rm -f $DROPIN; sshd -t && (systemctl reload ssh || systemctl reload sshd)'" >/dev/null
ok "автооткат через 5 минут, если не подтвердим"

step "Перезагрузка sshd"
pssh 'sudo systemctl reload ssh 2>/dev/null || sudo systemctl reload sshd'
ok "конфиг применён"

step "Проверка новым соединением"
sleep 3
fresh=0
for i in 1 2 3 4 5; do
  if ssh -o ConnectTimeout=15 -o BatchMode=yes \
         -o ControlMaster=no -o ControlPath=none "$KM_HOST" 'echo ok' >/dev/null 2>&1; then
    fresh=$((fresh + 1))
  fi
  sleep 2
done
printf '  свежих соединений прошло: %d из 5\n' "$fresh"
[ "$fresh" -ge 4 ] || die "связь всё ещё рвётся - автооткат сработает сам через 5 минут, не трогайте сервер"

step "Снимаю автооткат"
pssh "sudo systemctl stop $ROLLBACK_UNIT.timer 2>/dev/null; \
      sudo systemctl reset-failed $ROLLBACK_UNIT.timer 2>/dev/null; true" >/dev/null
ok "изменения закреплены"

printf '\n\033[1;32mSSH починен\033[0m\n'
