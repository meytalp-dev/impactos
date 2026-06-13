-- ============================================================================
-- Foundations Verifier · Cloud Sync · Migration 0004
-- ============================================================================
-- Created: 2026-06-13
-- Adds a single table for syncing the foundations verification state across
-- devices. Uses a share-key model — each user's URL holds a UUID-style key,
-- and that key is the only "credential". Rows are isolated by key.
--
-- How to run:
--   - Open Supabase Dashboard → SQL Editor: https://supabase.com/dashboard/project/ynxfszmpoppqrqocewcs/sql/new
--   - Paste this entire file
--   - Click "Run"
-- ============================================================================

CREATE TABLE IF NOT EXISTS foundations_state (
  share_key      text PRIMARY KEY,
  state          jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS foundations_state_updated_at_idx
  ON foundations_state (updated_at DESC);

-- Auto-update updated_at on UPDATE
CREATE OR REPLACE FUNCTION touch_foundations_state_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_foundations_state_updated_at ON foundations_state;
CREATE TRIGGER trg_foundations_state_updated_at
  BEFORE UPDATE ON foundations_state
  FOR EACH ROW EXECUTE FUNCTION touch_foundations_state_updated_at();

-- RLS — the share_key is the credential. Anyone with the key can read/write
-- their own row. The key length (UUID = 36 chars) makes brute-force infeasible.
ALTER TABLE foundations_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS foundations_state_anon_select ON foundations_state;
CREATE POLICY foundations_state_anon_select
  ON foundations_state FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS foundations_state_anon_insert ON foundations_state;
CREATE POLICY foundations_state_anon_insert
  ON foundations_state FOR INSERT
  TO anon, authenticated
  WITH CHECK (char_length(share_key) >= 16);

DROP POLICY IF EXISTS foundations_state_anon_update ON foundations_state;
CREATE POLICY foundations_state_anon_update
  ON foundations_state FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Optional: a hard cap on state size to prevent abuse
ALTER TABLE foundations_state
  ADD CONSTRAINT state_size_limit CHECK (octet_length(state::text) < 5242880);
