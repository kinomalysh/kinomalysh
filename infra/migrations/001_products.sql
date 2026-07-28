-- Товарные ролики (продукты) и их сцены + настройки студии.
-- Идемпотентно. Применять напрямую psql, т.к. drizzle-kit push на проде
-- падает на постороннем dropconstraint_internal (см. infra/README).

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(60) NOT NULL UNIQUE,
  title varchar(120) NOT NULL,
  tagline varchar(200),
  status varchar(16) NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position integer NOT NULL,
  kind varchar(12) NOT NULL,
  title varchar(120),
  prompt text NOT NULL DEFAULT '',
  voiceover_text text,
  motion_prompt text,
  clip_key text,
  clip_url text,
  clip_status varchar(12) NOT NULL DEFAULT 'idle',
  vo_key text,
  vo_status varchar(12) NOT NULL DEFAULT 'idle',
  fail_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_scenes_product_idx ON product_scenes (product_id, position);

CREATE TABLE IF NOT EXISTS settings (
  key varchar(60) PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
