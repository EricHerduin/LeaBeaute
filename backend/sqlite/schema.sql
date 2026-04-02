PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  price_eur REAL NULL,
  duration_min INTEGER NULL,
  note TEXT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_hours_general (
  config_id TEXT PRIMARY KEY,
  schedule_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_hours_exceptions (
  date TEXT PRIMARY KEY,
  end_date TEXT NULL,
  is_open INTEGER NOT NULL DEFAULT 1,
  start_time TEXT NULL,
  end_time TEXT NULL,
  reason TEXT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_hours_holidays (
  date TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_closed INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cookie_consents (
  anonymous_visitor_id TEXT PRIMARY KEY,
  decision TEXT NOT NULL,
  source TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  banner_version TEXT NOT NULL,
  locale TEXT NOT NULL,
  categories_json TEXT NOT NULL,
  ip_hash TEXT NULL,
  user_agent TEXT NULL,
  choice_expires_at TEXT NULL,
  evidence_expires_at TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cookie_consent_history (
  id TEXT PRIMARY KEY,
  anonymous_visitor_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  source TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  banner_version TEXT NOT NULL,
  locale TEXT NOT NULL,
  categories_json TEXT NOT NULL,
  ip_hash TEXT NULL,
  user_agent TEXT NULL,
  saved_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (anonymous_visitor_id) REFERENCES cookie_consents(anonymous_visitor_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gift_cards (
  id TEXT PRIMARY KEY,
  code TEXT NULL UNIQUE,
  amount_eur REAL NOT NULL,
  original_amount REAL NULL,
  status TEXT NOT NULL,
  stripe_session_id TEXT NULL UNIQUE,
  stripe_payment_intent_id TEXT NULL,
  buyer_firstname TEXT NOT NULL,
  buyer_lastname TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT NULL,
  recipient_name TEXT NULL,
  personal_message TEXT NULL,
  coupon_token TEXT NULL,
  expires_at TEXT NULL,
  redeemed_at TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  gift_card_id TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  amount REAL NOT NULL,
  original_amount REAL NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  coupon_token TEXT NULL,
  coupon_data_json TEXT NULL,
  metadata_json TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  value REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  valid_from TEXT NOT NULL,
  valid_to TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  max_uses INTEGER NULL,
  current_uses INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupon_usages (
  id TEXT PRIMARY KEY,
  coupon_code TEXT NOT NULL,
  session_id TEXT NULL,
  gift_card_id TEXT NULL,
  validation_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  applied_at TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_code) REFERENCES coupons(code) ON DELETE CASCADE,
  FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  text TEXT NOT NULL,
  service TEXT NULL,
  allow_display INTEGER NOT NULL DEFAULT 0,
  is_approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
