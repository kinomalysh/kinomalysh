ALTER TABLE products
  ADD COLUMN IF NOT EXISTS kind VARCHAR(8) NOT NULL DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS about TEXT,
  ADD COLUMN IF NOT EXISTS audience VARCHAR(120);

CREATE TABLE IF NOT EXISTS product_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  text_female TEXT,
  prompt TEXT NOT NULL DEFAULT '',
  prompt_female TEXT,
  sample_key TEXT,
  sample_status VARCHAR(12) NOT NULL DEFAULT 'idle',
  fail_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_sample_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS product_pages_product_position_idx
  ON product_pages (product_id, position);

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS pdf_key TEXT,
  ADD COLUMN IF NOT EXISTS audio_key TEXT;

CREATE TABLE IF NOT EXISTS story_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES product_pages(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  image_key TEXT,
  status VARCHAR(12) NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  fail_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS story_pages_story_page_idx
  ON story_pages (story_id, page_id);
