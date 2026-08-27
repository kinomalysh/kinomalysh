#!/usr/bin/env bash
set -euo pipefail

# Дамп базы в S3. Запускается на сервере по таймеру systemd.
# Секреты берутся из /etc/kinomalysh/{db,s3}.env

STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
KEEP_DAYS="${KEEP_DAYS:-14}"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

set -a
. /etc/kinomalysh/db.env
. /etc/kinomalysh/s3.env
set +a

DUMP="$WORK_DIR/kinomalysh-$STAMP.sql.gz"
pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip -9 > "$DUMP"

SIZE="$(stat -c %s "$DUMP")"
if [ "$SIZE" -lt 1024 ]; then
  echo "дамп подозрительно маленький ($SIZE байт) - не выгружаю" >&2
  exit 1
fi

AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY" \
aws --endpoint-url "$S3_ENDPOINT" --region "$S3_REGION" \
  s3 cp "$DUMP" "s3://$S3_BUCKET/backups/db/kinomalysh-$STAMP.sql.gz"

CUTOFF="$(date -u -d "$KEEP_DAYS days ago" +%Y-%m-%d)"
AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY" \
aws --endpoint-url "$S3_ENDPOINT" --region "$S3_REGION" \
  s3 ls "s3://$S3_BUCKET/backups/db/" | while read -r _ _ _ key; do
    stamp="${key#kinomalysh-}"
    day="${stamp%%T*}"
    if [[ "$day" < "$CUTOFF" ]]; then
      AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID" \
      AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY" \
      aws --endpoint-url "$S3_ENDPOINT" --region "$S3_REGION" \
        s3 rm "s3://$S3_BUCKET/backups/db/$key"
    fi
  done

echo "бэкап готов: backups/db/kinomalysh-$STAMP.sql.gz ($SIZE байт)"
