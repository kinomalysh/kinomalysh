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

Раздаётся статика фронта из `/srv/kinomalysh/web` — 56 пререндеренных страниц.
API (`apps/api`) ещё не развёрнут; когда поднимем, добавить в `Caddyfile`
`handle /api/* { reverse_proxy localhost:3001 }` **до** блока `try_files`.

### Решения по конфигу, которые легко сломать по незнанию

**`try_files {path} {path}/index.html /index.html` — без `{path}/`.** Если вернуть
`{path}/`, Caddy начнёт редиректить `/create` → `/create/` (308). А `canonical` и все
56 ссылок в `sitemap.xml` записаны **без** слэша — получится, что каждый URL из карты
сайта отдаёт редирект и не совпадает с каноническим. Это прямой удар по индексации.

**`script-src` содержит `'unsafe-inline'`** — вынужденно: на страницах есть
`<script type="application/ld+json">` со Schema.org-разметкой, а браузеры режут её
обычным `script-src 'self'`. Убрать `'unsafe-inline'` можно будет только когда фронт
начнёт отдаваться Node-сервером с per-request nonce. Пока это осознанный долг:
`object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'` и `form-action 'self'`
на месте и закрывают основное.

**`style-src`/`font-src` пускают Google Fonts** — сайт грузит Kurale, Golos Text и
Neucha с `fonts.googleapis.com`. Без этих исключений вёрстка падает на системные шрифты.
Правильнее шрифты самохостить: минус внешний домен из CSP, минус два TLS-рукопожатия.

**`admin localhost:2019` — не выключать.** С `admin off` перестаёт работать
`systemctl reload` (он ходит именно в этот API), и конфиг можно менять только полным
рестартом с обрывом соединений. Порт слушается только на localhost и закрыт ufw.

Грабли: **не запускайте `caddy` под `sudo` вручную** — он создаст
`/var/log/caddy/access.log` от `root:root 600`, и сервис потом не сможет в него писать,
reload упадёт с `permission denied`. Лечится
`sudo chown caddy:caddy /var/log/caddy/access.log`.

## Что ещё не сделано

- [x] Делегирование на Timeweb — зона авторитетна
- [x] Caddyfile под домен, выпуск SSL — готово, см. раздел выше
- [x] S3-хранилище — готово, см. раздел выше
- [ ] Добавить AAAA-запись на `2a03:6f00:a::2:d38c`
- [ ] Отдача роликов через CDN + presigned-ссылки в коде
- [ ] systemd-юниты для `api` и `worker`
- [ ] Выкладка кода и миграции базы
- [ ] Бэкапы: включить в панели + `pg_dump` в S3 по расписанию
- [ ] Отправка почты для email-OTP: SPF, DKIM, DMARC на новом домене
- [ ] Вынести воркер на Dedicated CPU, когда ffmpeg упрётся в общие ядра
