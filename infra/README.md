# Инфраструктура «Киномалыш»

## Продакшн-сервер

| | |
|---|---|
| Провайдер | Timeweb Cloud, Москва |
| IP | `217.149.22.50` |
| Тариф | 4 × 3.3 ГГц / 8 ГБ / 80 ГБ NVMe · 1800 ₽/мес + 180 ₽ за IPv4 |
| ОС | Ubuntu 26.04 LTS, ядро 7.0 |
| Домен | `kinomalysh.ru` (пока не направлен) |

## Подключение

Прописано в `~/.ssh/config`:

```bash
ssh kinomalysh        # рабочий пользователь deploy
ssh kinomalysh-root   # root, закрыт после провижининга
```

Вход только по ключу `~/.ssh/id_ed25519`. Пароли и вход под root отключены.

Если SSH не пускает и рвёт соединение на `kex_exchange_identification` — это
fail2ban забанил ваш IP. Лечится через веб-консоль в панели Timeweb:

```bash
fail2ban-client status sshd      # посмотреть, кто забанен
fail2ban-client unban --all
```

Чтобы не повторялось, добавьте свой адрес в `ADMIN_IPS` при провижининге.

## Провижининг

Скрипт идемпотентный — можно перезапускать сколько угодно, ничего не сломает
и не перегенерит уже созданные секреты.

```bash
scp infra/provision.sh kinomalysh-root:/tmp/
ssh kinomalysh-root 'ADMIN_IPS="1.2.3.4" bash /tmp/provision.sh'
```

Переменные окружения (все опциональны):

| Переменная | По умолчанию | Зачем |
|---|---|---|
| `ADMIN_IPS` | пусто | белый список fail2ban, через пробел |
| `DEPLOY_USER` | `deploy` | рабочий пользователь |
| `APP_DIR` | `/srv/kinomalysh` | корень приложения |
| `DB_NAME` / `DB_USER` | `kinomalysh` | база и роль Postgres |
| `SWAP_GB` | `4` | swap под пики ffmpeg |
| `NODE_MAJOR` | `22` | версия Node |
| `TZ_NAME` | `Europe/Moscow` | часовой пояс |

Что делает: локаль и таймзона, обновления, автообновления безопасности, swap,
пользователь `deploy` с ключом и sudo, харденинг SSH, ufw, fail2ban, Node,
ffmpeg, PostgreSQL с базой и ролью, Redis на localhost, Caddy, каталоги
приложения.

## Секреты

**В репозиторий не коммитим ничего.** `.env` закрыт в корневом `.gitignore`.

| Что | Где лежит |
|---|---|
| Пароль Postgres, `DATABASE_URL` | на сервере: `/etc/kinomalysh/db.env`, `chmod 600` |
| Ключи fal.ai и ElevenLabs | локально: `apps/worker/.env` |
| Приватный SSH-ключ | локально: `~/.ssh/id_ed25519` |

Пароль базы генерируется скриптом один раз и при повторных запусках
сохраняется. Посмотреть:

```bash
ssh kinomalysh 'sudo cat /etc/kinomalysh/db.env'
```

## DNS

DNS домена обслуживает **Timeweb**. Реестр `.RU` делегирует на NS Timeweb, зона там
живая и авторитетная (`aa`, собственный SOA `ns1.timeweb.ru`), `A @` → `217.149.22.50`.

- Регистратор: Reg.ru (только регистрация, DNS там не используется)
- NS: `ns1.timeweb.ru`, `ns2.timeweb.ru`, `ns3.timeweb.org`, `ns4.timeweb.org`
- Зона и записи: панель Timeweb Cloud → Домены и SSL → `kinomalysh.ru` → DNS
- Записи: `A @` и `A www` → `217.149.22.50`. **AAAA нет** — при этом у сервера
  есть глобальный IPv6 `2a03:6f00:a::2:d38c` и ufw пускает v6 на 80/443.
  Запись стоит добавить, но сначала проверить, что Caddy отдаёт по v6.

Домен в статусе `UNVERIFIED` — подана идентификация владельца через Госуслуги.
Без неё домен со временем снимают с делегирования.

### Как проверять DNS: только по HTTPS

**Локальная сеть на маке перехватывает весь UDP/53.** Проверено: запрос к `192.0.2.1`
(TEST-NET, маршрутизироваться не может) возвращает валидный ответ. Поэтому `dig` с мака
врёт — отдаёт кэш перехватчика без флага `aa` и с чужим SOA. На этом мы один раз уже
сделали неверный вывод, будто у Reg.ru сломана публикация зоны. Публикация исправна.

Проверять только так:

```bash
curl -s "https://dns.google/resolve?name=kinomalysh.ru&type=A" | jq .
curl -s -H 'accept: application/dns-json' \
  "https://cloudflare-dns.com/dns-query?name=kinomalysh.ru&type=NS" | jq .
ssh kinomalysh 'dig +norecurse +noall +comments +answer SOA kinomalysh.ru @ns1.timeweb.ru'
```

У сервера сеть чистая — оттуда `dig` можно доверять.

## S3

Бакет `kinomalysh-media`, регион СПб, **приватный**. Проверено: presigned-ссылка отдаёт
200, прямой запрос без подписи — 403. Видео детей отдаём только по подписанным ссылкам
с ограниченным сроком, публичных ссылок не делаем.

Ключи на сервере: `/etc/kinomalysh/s3.env`, `chmod 600`.
Endpoint `https://s3.twcstorage.ru`, region `ru-1`, path-style.

## Веб и SSL

Конфиг — `infra/Caddyfile`. Выкладка фронта одной командой:

```bash
./infra/deploy-web.sh
```

Скрипт собирает `packages/shared` и `apps/web`, валидирует Caddyfile **до** подмены,
льёт `dist/` в `/srv/kinomalysh/web` через `rsync --delete`, перезагружает Caddy и
проверяет, что ключевые страницы отдают 200. При любой осечке падает, не доломав живое.

Сертификаты Let's Encrypt выпущены 21.07.2026 на `kinomalysh.ru` и `www`, действуют
до 18.10.2026, Caddy продлевает сам. HTTP отдаёт 308 на HTTPS, `www` — 301 на apex.
Заголовки: HSTS 1 год + includeSubDomains, CSP, nosniff, `X-Frame-Options: DENY`,
Referrer-Policy, Permissions-Policy. Логи — `/var/log/caddy/access.log`, JSON,
ротация 50 МиБ × 10.

HSTS **без `preload`** сознательно: preload практически необратим, а домен новый.
Включать только когда всё встанет на HTTPS окончательно.

Раздаётся статика фронта из `/srv/kinomalysh/web` - пререндеренные страницы, включая
служебные (`/auth`, `/library`, `/profile`, `/payment-result`) с `noindex` в разметке:
так у клиентских экранов нет расхождения гидратации и в индекс они не попадают.
`/api/*` проксируется на `localhost:3001` **до** блока `try_files`.

**CSP пускает S3.** Готовые мультфильмы отдаются подписанными ссылками с
`s3.twcstorage.ru`, поэтому в политике основного домена стоят `img-src 'self' data: https:`
и `media-src 'self' https: blob:`. Со старым `img-src 'self' data:` и без `media-src`
плеер на странице заказа не проигрывал бы ничего.

### Решения по конфигу, которые легко сломать по незнанию

**`try_files {path} {path}/index.html /index.html` - без `{path}/`.** Если вернуть
`{path}/`, Caddy начнёт редиректить `/create` → `/create/` (308). А `canonical` и все
56 ссылок в `sitemap.xml` записаны **без** слэша - получится, что каждый URL из карты
сайта отдаёт редирект и не совпадает с каноническим. Это прямой удар по индексации.

**`script-src` содержит `'unsafe-inline'`** - вынужденно: на страницах есть
`<script type="application/ld+json">` со Schema.org-разметкой, а браузеры режут её
обычным `script-src 'self'`. Убрать `'unsafe-inline'` можно будет только когда фронт
начнёт отдаваться Node-сервером с per-request nonce. Пока это осознанный долг:
`object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'` и `form-action 'self'`
на месте и закрывают основное.

**`style-src`/`font-src` пускают Google Fonts** - сайт грузит Kurale, Golos Text и
Neucha с `fonts.googleapis.com`. Без этих исключений вёрстка падает на системные шрифты.
Правильнее шрифты самохостить: минус внешний домен из CSP, минус два TLS-рукопожатия.

**`admin localhost:2019` - не выключать.** С `admin off` перестаёт работать
`systemctl reload` (он ходит именно в этот API), и конфиг можно менять только полным
рестартом с обрывом соединений. Порт слушается только на localhost и закрыт ufw.

Грабли: **не запускайте `caddy` под `sudo` вручную** - он создаст
`/var/log/caddy/access.log` от `root:root 600`, и сервис потом не сможет в него писать,
reload упадёт с `permission denied`. Лечится
`sudo chown caddy:caddy /var/log/caddy/access.log`.

## Админка (admin.kinomalysh.ru)

Отдельное SPA (`apps/admin`) на поддомене `admin`. Вход по логину/паролю из таблицы
`admins` (не связана с клиентскими юзерами). Разделы: дашборд, заказы (просмотр,
статусы, правка промптов сцен в БД, перегенерация), пользователи (баланс токенов),
генерация рекламных роликов через fal.ai (Pixar-стиль и 9:16 зашиты по умолчанию).

Зависит от развёрнутого API и воркера — без них админка не работает.

### 1. DNS

В панели Timeweb Cloud → Домены и SSL → `kinomalysh.ru` → DNS добавить:

```
A  admin  →  217.149.22.50
```

Проверять только по HTTPS-резолверу (см. раздел про DNS выше):

```bash
curl -s "https://dns.google/resolve?name=admin.kinomalysh.ru&type=A" | jq .
```

Caddy выпустит сертификат на `admin.kinomalysh.ru` автоматически, как только запись
зарезолвится.

### 2. Блок в Caddyfile

Уже в `infra/Caddyfile`: статика из `/srv/kinomalysh/admin`, `handle_path /api/*`
проксирует на `localhost:3001` (срезая префикс `/api`), `/uploads/*` — туда же без
среза. CSP слегка ослаблен под превью роликов: `img-src`/`media-src` пускают `https:`
(ссылки fal), `script-src 'self'` без `unsafe-inline`.

### 3. API и воркер как сервисы

Юниты в `infra/systemd/`. Секреты — в `/etc/kinomalysh/` (`chmod 600`):

- `api.env` — `JWT_SECRET`, `WEB_URL`, `ADMIN_URL=https://admin.kinomalysh.ru`,
  `PUBLIC_API_URL`, `CASHERA_*`, `SMTP_*`, `UPLOADS_DIR`.
- `worker.env` — `FAL_KEY`, `REDIS_URL`, `UPLOADS_DIR` (тот же путь, что у API).

```bash
scp infra/systemd/*.service kinomalysh:/tmp/
ssh kinomalysh 'sudo install -m644 /tmp/kinomalysh-*.service /etc/systemd/system/ && \
  sudo systemctl daemon-reload && \
  sudo systemctl enable --now kinomalysh-api kinomalysh-worker'
```

### 4. Схема БД и первый админ

```bash
ssh kinomalysh 'cd /srv/kinomalysh/app && npm run db:push -w apps/api'
ssh kinomalysh 'cd /srv/kinomalysh/app && npm run admin:create -w apps/api -- <login> "<Имя>" "<пароль>"'
```

Без третьего аргумента пароль сгенерируется и выведется в консоль.

### 5. Выкладка фронта

```bash
./infra/deploy-admin.sh
```

Собирает `apps/admin`, валидирует Caddyfile до подмены, льёт `dist/` в
`/srv/kinomalysh/admin`, перезагружает Caddy, проверяет 200 на `https://admin.kinomalysh.ru/`.

## Выкатка

Один скрипт делает всё: проверяет чистоту дерева и тесты, тянет код на сервере,
пересобирает бэкенд, накатывает миграции, перезапускает сервисы, ставит таймер
бэкапа, выкладывает сайт и админку и проверяет боевые ручки.

```bash
./infra/deploy-all.sh
```

Скрипт падает на первой же осечке и не трогает живое, если сборка или валидация
Caddyfile не прошли. Отдельно доступны `./infra/deploy-web.sh` и
`./infra/deploy-admin.sh`, если нужна только статика.

Если SSH не отвечает, а сервер пингуется - проверьте, не заворачивает ли трафик
локальный VPN: `route get 217.149.22.50` должен показывать физический интерфейс,
а не `utun*`.

## Хранение и удаление данных

Обещания на сайте и в политике теперь исполняются кодом, а не на словах.

Воркер держит очередь `housekeeping` с повторяемой задачей раз в час
(`apps/worker/src/housekeeping.ts`):

- фото заказа удаляется с диска через **7 дней** после создания, в базе ставится
  `stories.photo_purged_at`;
- готовый мультфильм живёт **30 дней**: `stories.expires_at` проставляется в момент
  сборки, по истечении объект стирается из S3, статус переходит в `expired`;
- заодно чистятся протухшие refresh-токены и коды подтверждения почты.

Оплатить заказ, у которого фото уже стёрли, нельзя - API отдаёт 409 и просит
оформить заказ заново. Пользователь может удалить заказ сам (`DELETE /stories/:id`)
и весь аккаунт целиком (`DELETE /me`) - вместе с фото и файлами в S3.

Согласия фиксируются при оформлении: `consent_version` и `consent_at` в `stories`,
оба чекбокса обязательны на стороне API, а не только в интерфейсе.

## Бэкапы базы

`infra/backup-db.sh` - `pg_dump | gzip` в `s3://<бакет>/backups/db/`, хранение 14 дней.
Запуск по таймеру:

```bash
scp infra/systemd/kinomalysh-backup.* kinomalysh:/tmp/
ssh kinomalysh 'sudo install -m644 /tmp/kinomalysh-backup.* /etc/systemd/system/ && \
  sudo systemctl daemon-reload && sudo systemctl enable --now kinomalysh-backup.timer'
```

Скрипту нужен `awscli` на сервере и права чтения `/etc/kinomalysh/{db,s3}.env`.
Проверить разово: `sudo systemctl start kinomalysh-backup && journalctl -u kinomalysh-backup -n 20`.

## Миграции

Порядок применения - по номеру файла:

```bash
ssh kinomalysh 'set -a; . /etc/kinomalysh/db.env; set +a; \
  for f in /srv/kinomalysh/app/infra/migrations/*.sql; do \
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done'
```

Все миграции идемпотентны. `drizzle-kit push` на проде не использовать - молча не
применяет изменения (см. историю грабель ниже).

## Что ещё не сделано

- [x] Делегирование на Timeweb - зона авторитетна
- [x] Caddyfile под домен, выпуск SSL
- [x] S3-хранилище
- [x] systemd-юниты для `api` и `worker`
- [x] Выкладка кода и миграции базы
- [x] Бэкапы: `pg_dump` в S3 по таймеру
- [x] Удаление фото через 7 дней и результатов через 30
- [ ] Добавить AAAA-запись на `2a03:6f00:a::2:d38c`
- [ ] Платежи: ключи Cashera в `api.env` (без них пополнение отдаёт 503)
- [ ] Почта для email-OTP: `SMTP_*` в `api.env` плюс SPF, DKIM, DMARC на домене
- [ ] Самохостинг шрифтов - убрать Google Fonts из CSP
- [ ] Вынести воркер на Dedicated CPU, когда ffmpeg упрётся в общие ядра
