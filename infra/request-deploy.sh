#!/usr/bin/env bash
# Просит сервер выкатить текущий main. Работает через обычный git по HTTPS,
# поэтому не зависит от того, включён VPN или нет.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

[ -z "$(git status --porcelain)" ] || { echo "есть незакоммиченные изменения"; exit 1; }
npm test >/dev/null || { echo "тесты красные"; exit 1; }

git push --quiet origin main
git tag -f deploy >/dev/null
git push --quiet --force origin refs/tags/deploy

commit="$(git rev-parse --short HEAD)"
echo "Сервер выкатит $commit в течение минуты."
echo "Смотреть ход: ssh kinomalysh 'journalctl -u kinomalysh-deploy -f'"
echo "Или просто дождаться и проверить https://kinomalysh.ru/api/health"
