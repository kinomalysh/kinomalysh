ALTER TABLE product_scenes
  ADD COLUMN IF NOT EXISTS prompt_female TEXT,
  ADD COLUMN IF NOT EXISTS voiceover_text_female TEXT;
