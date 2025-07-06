-- backend/schema.sql
DROP TABLE IF EXISTS costs;
CREATE TABLE costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  cost_type TEXT NOT NULL CHECK(cost_type IN ('fixed', 'variable')),
  is_checked INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS budgets;
CREATE TABLE budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    salary REAL NOT NULL DEFAULT 0,
    -- MODIFIED: Added savings_goal column
    savings_goal REAL NOT NULL DEFAULT 0,
    fixed_percent INTEGER NOT NULL DEFAULT 40,
    variable_percent INTEGER NOT NULL DEFAULT 30,
    UNIQUE(year, month)
);