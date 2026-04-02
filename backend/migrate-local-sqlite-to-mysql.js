require("dotenv").config();

const { createMysqlPoolFromEnv, executeSchema } = require("./mysql/mysqlClient");
const { getSqliteDatabasePath, readRows } = require("./sqlite/sqliteClient");

function toJson(value, fallback = {}) {
  return JSON.stringify(value ?? fallback);
}

async function upsertAdminSetting(pool, key, valueJson) {
  await pool.query(
    `
      INSERT INTO admin_settings (\`key\`, \`value\`)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        \`value\` = VALUES(\`value\`)
    `,
    [key, valueJson ?? toJson(null, null)],
  );
}

async function main() {
  const mysqlPool = createMysqlPoolFromEnv();

  try {
    await executeSchema(mysqlPool);

    const sqlitePath = getSqliteDatabasePath();
    const adminSettings = readRows("SELECT * FROM admin_settings");
    for (const row of adminSettings) {
      await upsertAdminSetting(mysqlPool, row.key, row.value_json);
    }

    const priceItems = readRows("SELECT * FROM price_items");
    for (const row of priceItems) {
      await mysqlPool.query(
        `
          INSERT INTO price_items (
            id, category, name, price_eur, duration_min, note, is_active, sort_order, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
          ON DUPLICATE KEY UPDATE
            category = VALUES(category),
            name = VALUES(name),
            price_eur = VALUES(price_eur),
            duration_min = VALUES(duration_min),
            note = VALUES(note),
            is_active = VALUES(is_active),
            sort_order = VALUES(sort_order),
            updated_at = VALUES(updated_at)
        `,
        [
          row.id,
          row.category,
          row.name,
          row.price_eur,
          row.duration_min,
          row.note,
          row.is_active,
          row.sort_order,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    const general = readRows("SELECT * FROM business_hours_general");
    for (const row of general) {
      await mysqlPool.query(
        `
          INSERT INTO business_hours_general (config_id, schedule)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE
            schedule = VALUES(schedule)
        `,
        [row.config_id, row.schedule_json],
      );
    }

    const exceptions = readRows("SELECT * FROM business_hours_exceptions");
    for (const row of exceptions) {
      await mysqlPool.query(
        `
          INSERT INTO business_hours_exceptions (
            date, end_date, is_open, start_time, end_time, reason, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
          ON DUPLICATE KEY UPDATE
            end_date = VALUES(end_date),
            is_open = VALUES(is_open),
            start_time = VALUES(start_time),
            end_time = VALUES(end_time),
            reason = VALUES(reason),
            updated_at = VALUES(updated_at)
        `,
        [
          row.date,
          row.end_date,
          row.is_open,
          row.start_time,
          row.end_time,
          row.reason,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    const holidays = readRows("SELECT * FROM business_hours_holidays");
    for (const row of holidays) {
      await mysqlPool.query(
        `
          INSERT INTO business_hours_holidays (
            date, name, is_closed, created_at, updated_at
          ) VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            is_closed = VALUES(is_closed),
            updated_at = VALUES(updated_at)
        `,
        [row.date, row.name, row.is_closed, row.created_at, row.updated_at],
      );
    }

    const consents = readRows("SELECT * FROM cookie_consents");
    for (const row of consents) {
      await mysqlPool.query(
        `
          INSERT INTO cookie_consents (
            anonymous_visitor_id, decision, source, policy_version, banner_version, locale, categories,
            ip_hash, user_agent, choice_expires_at, evidence_expires_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            decision = VALUES(decision),
            source = VALUES(source),
            policy_version = VALUES(policy_version),
            banner_version = VALUES(banner_version),
            locale = VALUES(locale),
            categories = VALUES(categories),
            ip_hash = VALUES(ip_hash),
            user_agent = VALUES(user_agent),
            choice_expires_at = VALUES(choice_expires_at),
            evidence_expires_at = VALUES(evidence_expires_at),
            updated_at = VALUES(updated_at)
        `,
        [
          row.anonymous_visitor_id,
          row.decision,
          row.source,
          row.policy_version,
          row.banner_version,
          row.locale,
          row.categories_json,
          row.ip_hash,
          row.user_agent,
          row.choice_expires_at,
          row.evidence_expires_at,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    const consentHistory = readRows("SELECT * FROM cookie_consent_history");
    for (const row of consentHistory) {
      await mysqlPool.query(
        `
          INSERT INTO cookie_consent_history (
            id, anonymous_visitor_id, decision, source, policy_version, banner_version, locale,
            categories, ip_hash, user_agent, saved_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            decision = VALUES(decision),
            source = VALUES(source),
            policy_version = VALUES(policy_version),
            banner_version = VALUES(banner_version),
            locale = VALUES(locale),
            categories = VALUES(categories),
            ip_hash = VALUES(ip_hash),
            user_agent = VALUES(user_agent),
            saved_at = VALUES(saved_at)
        `,
        [
          row.id,
          row.anonymous_visitor_id,
          row.decision,
          row.source,
          row.policy_version,
          row.banner_version,
          row.locale,
          row.categories_json,
          row.ip_hash,
          row.user_agent,
          row.saved_at,
        ],
      );
    }

    const giftCards = readRows("SELECT * FROM gift_cards");
    for (const row of giftCards) {
      await mysqlPool.query(
        `
          INSERT INTO gift_cards (
            id, code, amount_eur, original_amount, status, stripe_session_id, stripe_payment_intent_id,
            buyer_firstname, buyer_lastname, buyer_email, buyer_phone, recipient_name, personal_message,
            coupon_token, expires_at, redeemed_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
          ON DUPLICATE KEY UPDATE
            code = VALUES(code),
            amount_eur = VALUES(amount_eur),
            original_amount = VALUES(original_amount),
            status = VALUES(status),
            stripe_session_id = VALUES(stripe_session_id),
            stripe_payment_intent_id = VALUES(stripe_payment_intent_id),
            buyer_firstname = VALUES(buyer_firstname),
            buyer_lastname = VALUES(buyer_lastname),
            buyer_email = VALUES(buyer_email),
            buyer_phone = VALUES(buyer_phone),
            recipient_name = VALUES(recipient_name),
            personal_message = VALUES(personal_message),
            coupon_token = VALUES(coupon_token),
            expires_at = VALUES(expires_at),
            redeemed_at = VALUES(redeemed_at),
            updated_at = VALUES(updated_at)
        `,
        [
          row.id,
          row.code,
          row.amount_eur,
          row.original_amount,
          row.status,
          row.stripe_session_id,
          row.stripe_payment_intent_id,
          row.buyer_firstname,
          row.buyer_lastname,
          row.buyer_email,
          row.buyer_phone,
          row.recipient_name,
          row.personal_message,
          row.coupon_token,
          row.expires_at,
          row.redeemed_at,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    const paymentTransactions = readRows("SELECT * FROM payment_transactions");
    for (const row of paymentTransactions) {
      await mysqlPool.query(
        `
          INSERT INTO payment_transactions (
            id, gift_card_id, session_id, amount, original_amount, currency, status,
            payment_status, coupon_token, coupon_data, metadata, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
          ON DUPLICATE KEY UPDATE
            gift_card_id = VALUES(gift_card_id),
            amount = VALUES(amount),
            original_amount = VALUES(original_amount),
            currency = VALUES(currency),
            status = VALUES(status),
            payment_status = VALUES(payment_status),
            coupon_token = VALUES(coupon_token),
            coupon_data = VALUES(coupon_data),
            metadata = VALUES(metadata),
            updated_at = VALUES(updated_at)
        `,
        [
          row.id,
          row.gift_card_id,
          row.session_id,
          row.amount,
          row.original_amount,
          row.currency,
          row.status,
          row.payment_status,
          row.coupon_token,
          row.coupon_data_json,
          row.metadata_json,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    const coupons = readRows("SELECT * FROM coupons");
    for (const row of coupons) {
      await mysqlPool.query(
        `
          INSERT INTO coupons (
            id, code, type, value, currency, valid_from, valid_to, is_active,
            max_uses, current_uses, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
          ON DUPLICATE KEY UPDATE
            code = VALUES(code),
            type = VALUES(type),
            value = VALUES(value),
            currency = VALUES(currency),
            valid_from = VALUES(valid_from),
            valid_to = VALUES(valid_to),
            is_active = VALUES(is_active),
            max_uses = VALUES(max_uses),
            current_uses = VALUES(current_uses),
            updated_at = VALUES(updated_at)
        `,
        [
          row.id,
          row.code,
          row.type,
          row.value,
          row.currency,
          row.valid_from,
          row.valid_to,
          row.is_active,
          row.max_uses,
          row.current_uses,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    const couponUsages = readRows("SELECT * FROM coupon_usages");
    for (const row of couponUsages) {
      await mysqlPool.query(
        `
          INSERT INTO coupon_usages (
            id, coupon_code, session_id, gift_card_id, validation_token, status,
            applied_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
          ON DUPLICATE KEY UPDATE
            coupon_code = VALUES(coupon_code),
            session_id = VALUES(session_id),
            gift_card_id = VALUES(gift_card_id),
            status = VALUES(status),
            applied_at = VALUES(applied_at),
            updated_at = VALUES(updated_at)
        `,
        [
          row.id,
          row.coupon_code,
          row.session_id,
          row.gift_card_id,
          row.validation_token,
          row.status,
          row.applied_at,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    const testimonials = readRows("SELECT * FROM testimonials");
    for (const row of testimonials) {
      await mysqlPool.query(
        `
          INSERT INTO testimonials (
            id, name, rating, text, service, allow_display, is_approved, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            rating = VALUES(rating),
            text = VALUES(text),
            service = VALUES(service),
            allow_display = VALUES(allow_display),
            is_approved = VALUES(is_approved),
            updated_at = VALUES(updated_at)
        `,
        [
          row.id,
          row.name,
          row.rating,
          row.text,
          row.service,
          row.allow_display,
          row.is_approved,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    console.info(`Migration SQLite locale -> MySQL terminée depuis ${sqlitePath}`);
  } finally {
    await mysqlPool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
