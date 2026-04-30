export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS Topic (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  icon         TEXT,
  source       TEXT NOT NULL DEFAULT 'builtin',
  active       INTEGER DEFAULT 1,
  created_at   INTEGER
);

CREATE TABLE IF NOT EXISTS Card (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id     INTEGER NOT NULL REFERENCES Topic(id),
  mode         TEXT NOT NULL CHECK(mode IN ('mcq', 'flashcard', 'scenario')),
  difficulty   INTEGER NOT NULL CHECK(difficulty BETWEEN 1 AND 5),
  question     TEXT NOT NULL,
  answer       TEXT NOT NULL,
  options      TEXT,
  code_snippet TEXT,
  explanation  TEXT,
  tags         TEXT,
  source       TEXT NOT NULL CHECK(source IN ('static', 'ai')),
  created_at   INTEGER
);

CREATE TABLE IF NOT EXISTS CardProgress (
  card_id             INTEGER PRIMARY KEY REFERENCES Card(id),
  interval_days       REAL DEFAULT 1,
  ease_factor         REAL DEFAULT 2.5,
  consecutive_correct INTEGER DEFAULT 0,
  times_seen          INTEGER DEFAULT 0,
  times_correct       INTEGER DEFAULT 0,
  next_due            INTEGER,
  retired             INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Session (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id     INTEGER REFERENCES Topic(id),
  mode         TEXT,
  proficiency  TEXT,
  total_cards  INTEGER,
  correct      INTEGER,
  started_at   INTEGER,
  ended_at     INTEGER
);

CREATE TABLE IF NOT EXISTS UserTopicConfig (
  topic_id    INTEGER PRIMARY KEY REFERENCES Topic(id),
  proficiency TEXT DEFAULT 'intermediate'
);

CREATE TABLE IF NOT EXISTS UserConfig (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_card_progress_next_due ON CardProgress(next_due);
CREATE INDEX IF NOT EXISTS idx_card_topic_diff_mode ON Card(topic_id, difficulty, mode);
CREATE INDEX IF NOT EXISTS idx_card_source ON Card(source);
`;
