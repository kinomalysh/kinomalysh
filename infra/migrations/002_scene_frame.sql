-- Кадр-основа геройской сцены: показываем его в админке, пока идёт оживление.
-- Идемпотентно, применять напрямую psql (см. infra/README).

ALTER TABLE product_scenes ADD COLUMN IF NOT EXISTS frame_url text;
