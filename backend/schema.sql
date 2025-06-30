-- backend/schema.sql
DROP TABLE IF EXISTS costs;
CREATE TABLE costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  cost_type TEXT NOT NULL CHECK(cost_type IN ('fixed', 'variable')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);