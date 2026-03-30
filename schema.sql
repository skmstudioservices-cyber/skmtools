-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Prices Table
CREATE TABLE IF NOT EXISTS prices (
  plan_name TEXT PRIMARY KEY,
  price_cent INTEGER NOT NULL,
  features TEXT
);

-- 💡 Seed Data
INSERT OR IGNORE INTO prices (plan_name, price_cent, features) VALUES 
('Basic', 999, '10 projects'),
('Pro', 2999, 'Unlimited projects'),
('Enterprise', 9999, 'Full API Access');
