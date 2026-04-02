require("dotenv").config();

const { MongoClient } = require("mongodb");
const {
  executeSchema,
  getSqliteDatabasePath,
  runSql,
  sqlBool,
  sqlJson,
  sqlValue,
} = require("./sqlite/sqliteClient");

function toIso(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function main() {
  const mongoUrl = process.env.MONGO_URL;
  const dbName = process.env.MONGO_DB_NAME || process.env.DB_NAME;

  if (!mongoUrl || !dbName) {
    throw new Error("MONGO_URL et MONGO_DB_NAME sont requis");
  }

  const mongoClient = new MongoClient(mongoUrl);

  try {
    await mongoClient.connect();
    const mongoDb = mongoClient.db(dbName);

    executeSchema();
    runSql(`
      PRAGMA foreign_keys = OFF;
      DELETE FROM cookie_consent_history;
      DELETE FROM cookie_consents;
      DELETE FROM payment_transactions;
      DELETE FROM coupon_usages;
      DELETE FROM coupons;
      DELETE FROM gift_cards;
      DELETE FROM testimonials;
      DELETE FROM business_hours_holidays;
      DELETE FROM business_hours_exceptions;
      DELETE FROM business_hours_general;
      DELETE FROM price_items;
      DELETE FROM admin_settings;
      PRAGMA foreign_keys = ON;
    `);

    const adminSettings = await mongoDb.collection("admin_settings").find({}).toArray();
    for (const doc of adminSettings) {
      const { _id, key, ...value } = doc;
      if (!key) continue;
      runSql(`
        INSERT OR REPLACE INTO admin_settings (key, value_json)
        VALUES (${sqlValue(key)}, ${sqlJson(value, null)});
      `);
    }

    const priceItems = await mongoDb.collection("price_items").find({}).toArray();
    for (const doc of priceItems) {
      runSql(`
        INSERT OR REPLACE INTO price_items (
          id, category, name, price_eur, duration_min, note, is_active, sort_order, created_at, updated_at
        ) VALUES (
          ${sqlValue(doc.id)},
          ${sqlValue(doc.category)},
          ${sqlValue(doc.name)},
          ${sqlValue(doc.priceEur ?? null)},
          ${sqlValue(doc.durationMin ?? null)},
          ${sqlValue(doc.note ?? null)},
          ${sqlBool(doc.isActive)},
          ${sqlValue(doc.sortOrder ?? 0)},
          ${sqlValue(toIso(doc.createdAt) || new Date().toISOString())},
          ${sqlValue(toIso(doc.updatedAt) || toIso(doc.createdAt) || new Date().toISOString())}
        );
      `);
    }

    const businessHoursGeneral = await mongoDb.collection("business_hours_general").find({}).toArray();
    for (const doc of businessHoursGeneral) {
      const { _id, ...schedule } = doc;
      runSql(`
        INSERT OR REPLACE INTO business_hours_general (config_id, schedule_json)
        VALUES ('main', ${sqlJson(schedule)});
      `);
    }

    const businessHoursExceptions = await mongoDb.collection("business_hours_exceptions").find({}).toArray();
    for (const doc of businessHoursExceptions) {
      runSql(`
        INSERT OR REPLACE INTO business_hours_exceptions (
          date, end_date, is_open, start_time, end_time, reason, created_at, updated_at
        ) VALUES (
          ${sqlValue(doc.date)},
          ${sqlValue(doc.endDate || null)},
          ${sqlBool(doc.isOpen)},
          ${sqlValue(doc.startTime || null)},
          ${sqlValue(doc.endTime || null)},
          ${sqlValue(doc.reason || null)},
          ${sqlValue(toIso(doc.createdAt) || new Date().toISOString())},
          ${sqlValue(toIso(doc.updatedAt) || toIso(doc.createdAt) || new Date().toISOString())}
        );
      `);
    }

    const holidays = await mongoDb.collection("business_hours_holidays").find({}).toArray();
    for (const doc of holidays) {
      runSql(`
        INSERT OR REPLACE INTO business_hours_holidays (
          date, name, is_closed, created_at, updated_at
        ) VALUES (
          ${sqlValue(doc.date)},
          ${sqlValue(doc.name)},
          ${sqlBool(doc.isClosed)},
          ${sqlValue(toIso(doc.createdAt) || new Date().toISOString())},
          ${sqlValue(toIso(doc.updatedAt) || toIso(doc.createdAt) || new Date().toISOString())}
        );
      `);
    }

    const consents = await mongoDb.collection("cookie_consents").find({}).toArray();
    for (const doc of consents) {
      runSql(`
        INSERT OR REPLACE INTO cookie_consents (
          anonymous_visitor_id, decision, source, policy_version, banner_version, locale, categories_json,
          ip_hash, user_agent, choice_expires_at, evidence_expires_at, created_at, updated_at
        ) VALUES (
          ${sqlValue(doc.anonymousVisitorId)},
          ${sqlValue(doc.decision)},
          ${sqlValue(doc.source)},
          ${sqlValue(doc.policyVersion)},
          ${sqlValue(doc.bannerVersion)},
          ${sqlValue(doc.locale)},
          ${sqlJson(doc.categories)},
          ${sqlValue(doc.ipHash || null)},
          ${sqlValue(doc.userAgent || null)},
          ${sqlValue(toIso(doc.choiceExpiresAt))},
          ${sqlValue(toIso(doc.evidenceExpiresAt))},
          ${sqlValue(toIso(doc.createdAt) || toIso(doc.updatedAt) || new Date().toISOString())},
          ${sqlValue(toIso(doc.updatedAt) || toIso(doc.createdAt) || new Date().toISOString())}
        );
      `);

      for (const entry of doc.history || []) {
        runSql(`
          INSERT OR REPLACE INTO cookie_consent_history (
            id, anonymous_visitor_id, decision, source, policy_version, banner_version, locale,
            categories_json, ip_hash, user_agent, saved_at
          ) VALUES (
            ${sqlValue(entry.id)},
            ${sqlValue(doc.anonymousVisitorId)},
            ${sqlValue(entry.decision)},
            ${sqlValue(entry.source)},
            ${sqlValue(entry.policyVersion)},
            ${sqlValue(entry.bannerVersion)},
            ${sqlValue(entry.locale)},
            ${sqlJson(entry.categories)},
            ${sqlValue(entry.ipHash || null)},
            ${sqlValue(entry.userAgent || null)},
            ${sqlValue(toIso(entry.savedAt) || toIso(doc.updatedAt) || new Date().toISOString())}
          );
        `);
      }
    }

    const giftCards = await mongoDb.collection("gift_cards").find({}).toArray();
    for (const doc of giftCards) {
      runSql(`
        INSERT OR REPLACE INTO gift_cards (
          id, code, amount_eur, original_amount, status, stripe_session_id, stripe_payment_intent_id,
          buyer_firstname, buyer_lastname, buyer_email, buyer_phone, recipient_name, personal_message,
          coupon_token, expires_at, redeemed_at, created_at, updated_at
        ) VALUES (
          ${sqlValue(doc.id)},
          ${sqlValue(doc.code || null)},
          ${sqlValue(doc.amountEur)},
          ${sqlValue(doc.original_amount ?? null)},
          ${sqlValue(doc.status)},
          ${sqlValue(doc.stripeSessionId || null)},
          ${sqlValue(doc.stripePaymentIntentId || null)},
          ${sqlValue(doc.buyer_firstname)},
          ${sqlValue(doc.buyer_lastname)},
          ${sqlValue(doc.buyer_email)},
          ${sqlValue(doc.buyer_phone || null)},
          ${sqlValue(doc.recipient_name || null)},
          ${sqlValue(doc.personal_message || null)},
          ${sqlValue(doc.coupon_token || null)},
          ${sqlValue(toIso(doc.expiresAt))},
          ${sqlValue(toIso(doc.redeemedAt))},
          ${sqlValue(toIso(doc.createdAt) || new Date().toISOString())},
          ${sqlValue(toIso(doc.updatedAt) || toIso(doc.createdAt) || new Date().toISOString())}
        );
      `);
    }

    const paymentTransactions = await mongoDb.collection("payment_transactions").find({}).toArray();
    for (const doc of paymentTransactions) {
      runSql(`
        INSERT OR REPLACE INTO payment_transactions (
          id, gift_card_id, session_id, amount, original_amount, currency, status, payment_status,
          coupon_token, coupon_data_json, metadata_json, created_at, updated_at
        ) VALUES (
          ${sqlValue(doc.id)},
          ${sqlValue(doc.gift_card_id)},
          ${sqlValue(doc.session_id)},
          ${sqlValue(doc.amount)},
          ${sqlValue(doc.original_amount ?? null)},
          ${sqlValue(doc.currency)},
          ${sqlValue(doc.status)},
          ${sqlValue(doc.payment_status)},
          ${sqlValue(doc.coupon_token || null)},
          ${sqlJson(doc.coupon_data, null)},
          ${sqlJson(doc.metadata, null)},
          ${sqlValue(toIso(doc.created_at) || new Date().toISOString())},
          ${sqlValue(toIso(doc.updated_at) || toIso(doc.created_at) || new Date().toISOString())}
        );
      `);
    }

    const coupons = await mongoDb.collection("coupons").find({}).toArray();
    for (const doc of coupons) {
      runSql(`
        INSERT OR REPLACE INTO coupons (
          id, code, type, value, currency, valid_from, valid_to, is_active, max_uses, current_uses, created_at, updated_at
        ) VALUES (
          ${sqlValue(doc.id)},
          ${sqlValue(doc.code)},
          ${sqlValue(doc.type)},
          ${sqlValue(doc.value)},
          ${sqlValue(doc.currency || "EUR")},
          ${sqlValue(toIso(doc.validFrom))},
          ${sqlValue(toIso(doc.validTo))},
          ${sqlBool(doc.isActive)},
          ${sqlValue(doc.maxUses ?? null)},
          ${sqlValue(doc.currentUses ?? 0)},
          ${sqlValue(toIso(doc.createdAt) || new Date().toISOString())},
          ${sqlValue(toIso(doc.updatedAt) || toIso(doc.createdAt) || new Date().toISOString())}
        );
      `);
    }

    const couponUsages = await mongoDb.collection("coupon_usages").find({}).toArray();
    for (const doc of couponUsages) {
      runSql(`
        INSERT OR REPLACE INTO coupon_usages (
          id, coupon_code, session_id, gift_card_id, validation_token, status, applied_at, created_at, updated_at
        ) VALUES (
          ${sqlValue(doc.id)},
          ${sqlValue(doc.coupon_code)},
          ${sqlValue(doc.session_id || null)},
          ${sqlValue(doc.gift_card_id || null)},
          ${sqlValue(doc.validation_token)},
          ${sqlValue(doc.status)},
          ${sqlValue(toIso(doc.applied_at))},
          ${sqlValue(toIso(doc.created_at) || new Date().toISOString())},
          ${sqlValue(toIso(doc.updated_at) || toIso(doc.created_at) || new Date().toISOString())}
        );
      `);
    }

    const testimonials = await mongoDb.collection("testimonials").find({}).toArray();
    for (const doc of testimonials) {
      runSql(`
        INSERT OR REPLACE INTO testimonials (
          id, name, rating, text, service, allow_display, is_approved, created_at, updated_at
        ) VALUES (
          ${sqlValue(doc.id)},
          ${sqlValue(doc.name)},
          ${sqlValue(doc.rating)},
          ${sqlValue(doc.text)},
          ${sqlValue(doc.service || null)},
          ${sqlBool(doc.allowDisplay)},
          ${sqlBool(doc.isApproved)},
          ${sqlValue(toIso(doc.createdAt) || new Date().toISOString())},
          ${sqlValue(toIso(doc.updatedAt) || toIso(doc.createdAt) || new Date().toISOString())}
        );
      `);
    }

    console.info(`Migration MongoDB -> SQLite locale terminée : ${getSqliteDatabasePath()}`);
  } finally {
    await mongoClient.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
