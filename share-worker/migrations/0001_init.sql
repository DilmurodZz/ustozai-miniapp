-- every Telegram user who opened the Mini App
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  first_name TEXT, username TEXT, lang TEXT,
  can_write INTEGER DEFAULT 0,      -- allowed the bot to write to them
  blocked INTEGER DEFAULT 0,        -- a message to them failed (blocked the bot)
  first_seen TEXT NOT NULL, last_seen TEXT NOT NULL
);
-- one row per user, day and app section they opened (Tashkent date)
CREATE TABLE IF NOT EXISTS visits (
  day TEXT NOT NULL, user_id INTEGER NOT NULL, section TEXT NOT NULL,
  PRIMARY KEY (day, user_id, section)
);
CREATE INDEX IF NOT EXISTS visits_day ON visits(day);
CREATE INDEX IF NOT EXISTS users_first ON users(first_seen);
