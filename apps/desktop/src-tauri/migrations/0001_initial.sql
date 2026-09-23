PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS contexts (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  stable_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  context_id TEXT REFERENCES contexts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('file','folder','image','url','text')),
  title TEXT NOT NULL,
  source_path TEXT,
  source_url TEXT,
  text_value TEXT,
  mime_type TEXT,
  byte_size INTEGER,
  thumbnail_path TEXT,
  content_hash TEXT,
  created_at TEXT NOT NULL,
  last_opened_at TEXT,
  is_missing INTEGER NOT NULL DEFAULT 0 CHECK (is_missing IN (0,1))
);

CREATE INDEX IF NOT EXISTS idx_items_context_created ON items(context_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_source_path ON items(source_path) WHERE source_path IS NOT NULL;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
