-- Публикация книжного каталога. Выполняется ровно один раз за всю жизнь базы:
-- агент прогоняет миграции при каждой выкатке, а безусловный UPDATE возвращал бы
-- в продажу книги, которые администратор снял с витрины вручную.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'books_published_once') THEN
    UPDATE products
       SET status = 'active', updated_at = now()
     WHERE kind = 'book' AND status = 'draft';

    INSERT INTO settings (key, value) VALUES ('books_published_once', 'done')
    ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;
