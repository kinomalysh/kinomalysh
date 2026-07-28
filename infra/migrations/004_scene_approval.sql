-- Утверждение сцены человеком: продукт нельзя опубликовать, пока каждая сцена
-- не просмотрена и не утверждена. Утверждённые ассеты хранятся отдельными
-- ключами, чтобы новый прогон не затирал пример, который сейчас на витрине.
-- Идемпотентно, применять напрямую psql (см. infra/README).

ALTER TABLE product_scenes ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE product_scenes ADD COLUMN IF NOT EXISTS approved_clip_key text;
ALTER TABLE product_scenes ADD COLUMN IF NOT EXISTS approved_vo_key text;
