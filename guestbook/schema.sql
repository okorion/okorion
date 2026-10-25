CREATE TABLE IF NOT EXISTS greetings (
  id TEXT PRIMARY KEY,
  visitor_key TEXT NOT NULL UNIQUE,
  request_id TEXT NOT NULL,
  asset TEXT NOT NULL CHECK (asset IN ('Camera_01','gamepad','rubber_duck_toy','boombox','pocket_watch','chess_set','carved_wooden_elephant','horse_head','lambis_shell')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS greetings_expiry ON greetings(expires_at);
CREATE INDEX IF NOT EXISTS greetings_created ON greetings(created_at DESC);
