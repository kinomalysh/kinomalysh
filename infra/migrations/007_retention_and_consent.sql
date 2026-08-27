ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS photo_purged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_version VARCHAR(16),
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS stories_photo_purge_idx
  ON stories (created_at)
  WHERE photo_path IS NOT NULL AND photo_purged_at IS NULL;

CREATE INDEX IF NOT EXISTS stories_expiry_idx
  ON stories (expires_at)
  WHERE result_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS stories_user_created_idx ON stories (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS token_ledger_user_created_idx ON token_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_user_created_idx ON payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS story_scenes_story_idx ON story_scenes (story_id);
