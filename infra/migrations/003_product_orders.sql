-- Клиентские заказы товарных мультиков: витринные поля продукта,
-- привязка заказа к продукту и рендеры сцен по заказу.
-- Идемпотентно, применять напрямую psql (см. infra/README).

ALTER TABLE products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_tokens integer NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS preview_key text;

ALTER TABLE stories ADD COLUMN IF NOT EXISTS result_key text;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS product_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stories_product_id_fkey'
  ) THEN
    ALTER TABLE stories
      ADD CONSTRAINT stories_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS story_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  scene_id uuid NOT NULL REFERENCES product_scenes(id) ON DELETE CASCADE,
  position integer NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'pending',
  clip_key text,
  attempts integer NOT NULL DEFAULT 0,
  fail_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS story_scenes_story_scene_idx ON story_scenes (story_id, scene_id);
CREATE INDEX IF NOT EXISTS story_scenes_story_pos_idx ON story_scenes (story_id, position);
