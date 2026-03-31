-- SKMTools D1 Database Schema

-- LEADS / USERS
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  ref_code TEXT UNIQUE NOT NULL,
  referred_by TEXT,
  country TEXT DEFAULT 'us',
  tier INTEGER DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'free',
  verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- REFERRALS
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_code TEXT NOT NULL,
  referred_email TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(referrer_code, referred_email)
);

-- AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,
  url_audited TEXT,
  score INTEGER,
  country TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- BLOG POSTS
CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  category TEXT,
  country_target TEXT DEFAULT 'global',
  content TEXT,
  published INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ADMIN USERS
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'editor',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ADMIN: Insert your email-keyed admin record
-- Replace YOUR_SECURE_KEY below with the value of your ADMIN_KEY wrangler secret
INSERT OR IGNORE INTO admin_users (username, password_hash, role)
VALUES ('subham@skmstudio.in', 'USE_YOUR_WRANGLER_ADMIN_KEY_SECRET', 'superadmin');

-- SEED: Sample blog posts
INSERT OR IGNORE INTO blog_posts (slug, title, meta_description, category, country_target, published)
VALUES
('hvac-google-ranking', 'Why Your HVAC Business Doesn''t Show on Google', 'HVAC companies losing leads to competitors on Google Maps. Here is exactly why and how to fix it in 7 steps.', 'HVAC', 'us,gb,au', 1),
('lawyer-local-seo', 'Local SEO for Lawyers: Rank Before Your Competitor Does', 'Law firms are missing 70% of local searches. A step-by-step guide for attorneys to dominate Google Maps in their city.', 'Law Firms', 'us,gb,ca', 1),
('plumber-google-maps', 'Plumber''s Guide to Dominating Google Maps', 'Plumbers losing emergency calls to competitors. How to fix your Google Business Profile and rank #1 in your city.', 'Plumbers', 'us,gb,au', 1),
('google-business-profile-tips', '10 Google Business Profile Mistakes Costing You Leads', 'The most common Google Business Profile errors local businesses make — and how to fix each one in under 10 minutes.', 'All Businesses', 'global', 1);
