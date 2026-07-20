#!/usr/bin/env bash
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_DIR="${APP_DIR:-/srv/kinomalysh}"
SECRETS_DIR="/etc/kinomalysh"
DB_NAME="${DB_NAME:-kinomalysh}"
DB_USER="${DB_USER:-kinomalysh}"
ADMIN_IPS="${ADMIN_IPS:-}"
TZ_NAME="${TZ_NAME:-Europe/Moscow}"
SWAP_GB="${SWAP_GB:-4}"
NODE_MAJOR="${NODE_MAJOR:-22}"

step() { printf '\n\033[1;34m▸ %s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }

[ "$(id -u)" -eq 0 ] || { echo "запускать от root"; exit 1; }

export DEBIAN_FRONTEND=noninteractive

step "Локаль и часовой пояс"
timedatectl set-timezone "$TZ_NAME"
update-locale LANG=C.UTF-8 >/dev/null 2>&1 || true
ok "$TZ_NAME, $(date '+%H:%M %Z')"

step "Базовые пакеты"
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl ca-certificates gnupg lsb-release apt-transport-https \
  ufw fail2ban unattended-upgrades htop git jq rsync \
  build-essential python3 debian-keyring debian-archive-keyring
ok "установлены"

step "Автоматические обновления безопасности"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
systemctl enable --now unattended-upgrades >/dev/null 2>&1 || true
ok "включены"

step "Swap ${SWAP_GB}G"
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l "${SWAP_GB}G" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ok "создан"
else
  ok "уже есть"
fi
sysctl -qw vm.swappiness=10
grep -q '^vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf

step "Пользователь $DEPLOY_USER"
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER" >/dev/null
fi
usermod -aG sudo "$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
if [ -f /root/.ssh/authorized_keys ]; then
  install -m 600 -o "$DEPLOY_USER" -g "$DEPLOY_USER" \
    /root/.ssh/authorized_keys "/home/$DEPLOY_USER/.ssh/authorized_keys"
fi
echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/90-$DEPLOY_USER
chmod 440 /etc/sudoers.d/90-$DEPLOY_USER
visudo -cq -f /etc/sudoers.d/90-$DEPLOY_USER
ok "готов, ключ установлен"

step "SSH"
cat > /etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
KbdInteractiveAuthentication no
X11Forwarding no
MaxAuthTries 5
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
sshd -t
systemctl reload ssh 2>/dev/null || systemctl reload sshd
ok "root закрыт, пароли отключены"

step "Фаервол"
ufw allow 22/tcp  >/dev/null
ufw allow 80/tcp  >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
ok "$(ufw status | grep -c ALLOW) правил, активен"

step "fail2ban"
{
  echo "[sshd]"
  echo "enabled = true"
  echo "maxretry = 6"
  echo "bantime = 15m"
  echo "findtime = 10m"
  echo "ignoreip = 127.0.0.1/8 ::1 $ADMIN_IPS"
} > /etc/fail2ban/jail.local
systemctl enable --now fail2ban >/dev/null 2>&1
systemctl restart fail2ban
ok "порог 6 попыток, бан 15 минут"

step "Node.js"
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  if curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" -o /tmp/nodesource.sh 2>/dev/null && bash /tmp/nodesource.sh >/dev/null 2>&1; then
    apt-get install -y -qq nodejs
  else
    warn "NodeSource недоступен для этого релиза, ставлю из репозитория Ubuntu"
    apt-get install -y -qq nodejs npm
  fi
fi
ok "node $(node --version), npm $(npm --version)"

step "ffmpeg"
apt-get install -y -qq ffmpeg
if ffmpeg -hide_banner -filters 2>/dev/null | grep -qw drawtext; then
  ok "$(ffmpeg -version | head -1 | cut -d' ' -f1-3), drawtext ЕСТЬ"
else
  warn "$(ffmpeg -version | head -1 | cut -d' ' -f1-3), drawtext ОТСУТСТВУЕТ — титры рисуем через overlay PNG"
fi

step "PostgreSQL"
apt-get install -y -qq postgresql postgresql-contrib
systemctl enable --now postgresql
install -d -m 700 "$SECRETS_DIR"
if [ ! -f "$SECRETS_DIR/db.env" ]; then
  DB_PASS="$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 32)"
  printf 'DB_NAME=%s\nDB_USER=%s\nDB_PASSWORD=%s\nDATABASE_URL=postgres://%s:%s@127.0.0.1:5432/%s\n' \
    "$DB_NAME" "$DB_USER" "$DB_PASS" "$DB_USER" "$DB_PASS" "$DB_NAME" > "$SECRETS_DIR/db.env"
  chmod 600 "$SECRETS_DIR/db.env"
  ok "пароль сгенерирован"
else
  DB_PASS="$(grep '^DB_PASSWORD=' "$SECRETS_DIR/db.env" | cut -d= -f2-)"
  ok "пароль уже был, оставляю"
fi
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 \
  || sudo -u postgres psql -qc "CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS'"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 \
  || sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
ok "база $DB_NAME, роль $DB_USER, слушает только localhost"

step "Redis"
apt-get install -y -qq redis-server
sed -i 's/^# *maxmemory-policy .*/maxmemory-policy noeviction/' /etc/redis/redis.conf || true
grep -q '^bind 127.0.0.1' /etc/redis/redis.conf || sed -i 's/^bind .*/bind 127.0.0.1 ::1/' /etc/redis/redis.conf
systemctl enable --now redis-server
systemctl restart redis-server
ok "$(redis-server --version | cut -d' ' -f1-3), только localhost"

step "Caddy"
if ! command -v caddy >/dev/null 2>&1; then
  curl -fsSL 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update -qq
  apt-get install -y -qq caddy
fi
systemctl enable caddy >/dev/null 2>&1
ok "$(caddy version | head -1)"

step "Каталоги приложения"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR" "$APP_DIR/releases" "$APP_DIR/shared" "$APP_DIR/tmp"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" /var/log/kinomalysh
setfacl -m u:"$DEPLOY_USER":r "$SECRETS_DIR/db.env" 2>/dev/null || true
ok "$APP_DIR"

step "Итог"
printf '  %-14s %s\n' "хост"    "$(hostname) · $(hostname -I | awk '{print $1}')"
printf '  %-14s %s\n' "система" "$(. /etc/os-release && echo "$PRETTY_NAME") · ядро $(uname -r)"
printf '  %-14s %s\n' "ресурсы" "$(nproc) ядер · $(free -h | awk '/Mem:/{print $2}') RAM · $(df -h / | awk 'NR==2{print $4}') свободно · swap ${SWAP_GB}G"
printf '  %-14s %s\n' "node"    "$(node --version)"
printf '  %-14s %s\n' "ffmpeg"  "$(ffmpeg -version 2>/dev/null | head -1 | cut -d' ' -f3)"
printf '  %-14s %s\n' "сервисы" "$(systemctl is-active postgresql redis-server caddy ssh fail2ban | paste -sd' ' -)"
printf '  %-14s %s\n' "секреты" "$SECRETS_DIR/db.env (chmod 600)"
echo
