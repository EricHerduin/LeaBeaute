CREATE TABLE IF NOT EXISTS admin_settings (
  `key` VARCHAR(191) NOT NULL PRIMARY KEY,
  `value` JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_items (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  category VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  price_eur DECIMAL(10,2) NULL,
  duration_min INT NULL,
  note TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_price_items_category_sort (category, sort_order, name),
  INDEX idx_price_items_active (is_active)
);

CREATE TABLE IF NOT EXISTS business_hours_general (
  config_id VARCHAR(32) NOT NULL PRIMARY KEY,
  schedule JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_hours_exceptions (
  date DATE NOT NULL PRIMARY KEY,
  end_date DATE NULL,
  is_open TINYINT(1) NOT NULL DEFAULT 1,
  start_time TIME NULL,
  end_time TIME NULL,
  reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_hours_holidays (
  date DATE NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_closed TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cookie_consents (
  anonymous_visitor_id VARCHAR(191) NOT NULL PRIMARY KEY,
  decision VARCHAR(64) NOT NULL,
  source VARCHAR(64) NOT NULL,
  policy_version VARCHAR(64) NOT NULL,
  banner_version VARCHAR(64) NOT NULL,
  locale VARCHAR(16) NOT NULL,
  categories JSON NOT NULL,
  ip_hash VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  choice_expires_at DATETIME NULL,
  evidence_expires_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_cookie_consents_updated_at (updated_at),
  INDEX idx_cookie_consents_decision (decision)
);

CREATE TABLE IF NOT EXISTS cookie_consent_history (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  anonymous_visitor_id VARCHAR(191) NOT NULL,
  decision VARCHAR(64) NOT NULL,
  source VARCHAR(64) NOT NULL,
  policy_version VARCHAR(64) NOT NULL,
  banner_version VARCHAR(64) NOT NULL,
  locale VARCHAR(16) NOT NULL,
  categories JSON NOT NULL,
  ip_hash VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  saved_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cookie_history_consent
    FOREIGN KEY (anonymous_visitor_id) REFERENCES cookie_consents(anonymous_visitor_id)
    ON DELETE CASCADE,
  INDEX idx_cookie_history_visitor (anonymous_visitor_id, saved_at)
);

CREATE TABLE IF NOT EXISTS gift_cards (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  code VARCHAR(64) NULL UNIQUE,
  amount_eur DECIMAL(10,2) NOT NULL,
  original_amount DECIMAL(10,2) NULL,
  status VARCHAR(32) NOT NULL,
  stripe_session_id VARCHAR(255) NULL UNIQUE,
  stripe_payment_intent_id VARCHAR(255) NULL,
  buyer_firstname VARCHAR(191) NOT NULL,
  buyer_lastname VARCHAR(191) NOT NULL,
  buyer_email VARCHAR(255) NOT NULL,
  buyer_phone VARCHAR(64) NULL,
  recipient_name VARCHAR(191) NULL,
  personal_message TEXT NULL,
  coupon_token VARCHAR(255) NULL,
  expires_at DATETIME NULL,
  redeemed_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_gift_cards_status_created (status, created_at),
  INDEX idx_gift_cards_buyer_email (buyer_email),
  INDEX idx_gift_cards_recipient_name (recipient_name)
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  gift_card_id VARCHAR(191) NOT NULL,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  original_amount DECIMAL(10,2) NULL,
  currency VARCHAR(16) NOT NULL,
  status VARCHAR(64) NOT NULL,
  payment_status VARCHAR(64) NOT NULL,
  coupon_token VARCHAR(255) NULL,
  coupon_data JSON NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_transactions_gift_card
    FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id)
    ON DELETE CASCADE,
  INDEX idx_payment_transactions_created (created_at)
);

CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  type VARCHAR(32) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  currency VARCHAR(16) NOT NULL DEFAULT 'EUR',
  valid_from DATETIME NOT NULL,
  valid_to DATETIME NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  max_uses INT NULL,
  current_uses INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_coupons_valid_to (valid_to),
  INDEX idx_coupons_active (is_active)
);

CREATE TABLE IF NOT EXISTS coupon_usages (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  coupon_code VARCHAR(64) NOT NULL,
  session_id VARCHAR(255) NULL,
  gift_card_id VARCHAR(191) NULL,
  validation_token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(64) NOT NULL,
  applied_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_coupon_usages_coupon
    FOREIGN KEY (coupon_code) REFERENCES coupons(code)
    ON DELETE CASCADE,
  CONSTRAINT fk_coupon_usages_gift_card
    FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id)
    ON DELETE SET NULL,
  INDEX idx_coupon_usages_status (status),
  INDEX idx_coupon_usages_created (created_at)
);

CREATE TABLE IF NOT EXISTS testimonials (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  rating INT NOT NULL,
  text TEXT NOT NULL,
  service VARCHAR(191) NULL,
  allow_display TINYINT(1) NOT NULL DEFAULT 0,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_testimonials_approved_created (is_approved, created_at)
);
