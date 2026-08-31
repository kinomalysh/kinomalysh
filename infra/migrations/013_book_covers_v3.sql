-- Первая версия обложек вышла с пустой полосой сверху: модель буквально
-- исполняла просьбу оставить место под заголовок. Промпт переписан, обложки
-- пересобираются ровно один раз.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'book_covers_v3') THEN
    UPDATE products SET preview_key = NULL, updated_at = now() WHERE kind = 'book';
    DELETE FROM settings WHERE key = 'book_samples_seeded';
    INSERT INTO settings (key, value) VALUES ('book_covers_v3', 'reset') ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;
