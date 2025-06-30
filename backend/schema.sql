-- backend/schema.sql
DROP TABLE IF EXISTS costs;
CREATE TABLE costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  cost_type TEXT NOT NULL CHECK(cost_type IN ('fixed', 'variable')),
  is_checked INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);