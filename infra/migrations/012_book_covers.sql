-- Обложка книги это отдельный кадр по канону киноплаката, а не первая
-- страница: у страницы верхняя треть намеренно пустая под текст, и на
-- обложке это читалось как обрезанная фотография.
ALTER TABLE products ADD COLUMN IF NOT EXISTS cover_prompt TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cover_mood VARCHAR(120);

UPDATE products SET cover_prompt = 'a small child sitting up in bed at night holding a tiny glowing golden spark in cupped hands close to the face, warm golden light on the cheeks', cover_mood = 'wonder replacing fear'
 WHERE slug = 'night-lights' AND cover_prompt IS NULL;
UPDATE products SET cover_prompt = 'a small child in pyjamas riding a floating bed among big friendly stars, sleepy delighted smile, an enormous warm moon behind', cover_mood = 'calm sleepy magic'
 WHERE slug = 'moon-invites' AND cover_prompt IS NULL;
UPDATE products SET cover_prompt = 'a small child with a determined brave face and a tiny grumpy storm cloud hovering just above the head', cover_mood = 'a big hot feeling, gently held'
 WHERE slug = 'angry-cloud' AND cover_prompt IS NULL;
UPDATE products SET cover_prompt = 'a small child pressing an open palm with a soft golden glow to the cheek, small backpack on the shoulders, brave uncertain smile', cover_mood = 'courage at the door'
 WHERE slug = 'first-morning' AND cover_prompt IS NULL;
UPDATE products SET cover_prompt = 'an older child gently holding a tiny newborn hand, looking up with soft pride', cover_mood = 'tenderness after jealousy'
 WHERE slug = 'now-we-are-two' AND cover_prompt IS NULL;
UPDATE products SET cover_prompt = 'a proud toddler wearing a paper crown, hands on hips, chin up', cover_mood = 'triumphant pride'
 WHERE slug = 'little-king-throne' AND cover_prompt IS NULL;
UPDATE products SET cover_prompt = 'a small child holding a stethoscope to a plush teddy bear, delighted curious smile in a bright friendly clinic', cover_mood = 'curiosity beating fear'
 WHERE slug = 'doctor-warm-light' AND cover_prompt IS NULL;
UPDATE products SET cover_prompt = 'two small children holding one bright red ball together, both laughing', cover_mood = 'shared joy'
 WHERE slug = 'one-ball-for-two' AND cover_prompt IS NULL;
UPDATE products SET cover_prompt = 'a small child sitting close beside a soft bear cub, calm quiet face, warm evening light', cover_mood = 'being heard without words'
 WHERE slug = 'who-hears-silence' AND cover_prompt IS NULL;
UPDATE products SET cover_prompt = 'a small child cupping one brilliant golden star in both hands, brave face lit warmly from below', cover_mood = 'small but brave'
 WHERE slug = 'star-defender' AND cover_prompt IS NULL;

-- Сбрасываем обложки, собранные из первой страницы, ровно один раз.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'book_covers_v2') THEN
    UPDATE products SET preview_key = NULL, updated_at = now() WHERE kind = 'book';
    DELETE FROM settings WHERE key = 'book_covers_seeded';
    INSERT INTO settings (key, value) VALUES ('book_covers_v2', 'reset') ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;
