require("dotenv").config();

const { MongoClient } = require("mongodb");
const { createMysqlPoolFromEnv, executeSchema } = require("./mysql/mysqlClient");

function toDateTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 19).replace("T", " ");
}

function toJson(value, fallback = {}) {
  return JSON.stringify(value ?? fallback);
}

async function upsertAdminSetting(pool, key, value) {
  await pool.query(
    `
      INSERT INTO admin_settings (\`key\`, \`value\`)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        \`value\` = VALUES(\`value\`)
    `,
    [key, toJson(value, null)],
  );
}

async function migrateCollectionInBatches(collection, handler, batchSize = 200) {
  let offset = 0;

  while (true) {
    const items = await collection.find({}).skip(offset).limit(batchSize).toArray();
    if (items.length === 0) {
      break;
    }

    for (const item of items) {
      await handler(item);
    }

    offset += items.length;
  }
}

async function main() {
  const mongoUrl = process.env.MONGO_URL;
  const dbName = process.env.MONGO_DB_NAME || process.env.MONGO_LEGACY_DB_NAME || process.env.MONGO_DB || process.env.DB_NAME;

  if (!mongoUrl || !dbName) {
    throw new Error("MONGO_URL et un nom de base Mongo sont requis pour migrer");
  }

  const mongoClient = new MongoClient(mongoUrl);
  const mysqlPool = createMysqlPoolFromEnv();

  try {
    await mongoClient.connect();
    await executeSchema(mysqlPool);

    const mongoDb = mongoClient.db(dbName);

    await migrateCollectionInBatches(mongoDb.collection("admin_settings"), async (doc) => {
      if (!doc?.key) return;
      const { _id, key, ...value } = doc;
      await upsertAdminSetting(mysqlPool, key, value);
    });

    await migrateCollectionInBatches(mongoDb.collection("price_items"), async (doc) => {
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
          doc.id,
          doc.category,
          doc.name,
          doc.priceEur ?? null,
          doc.durationMin ?? null,
          doc.note ?? null,
          doc.isActive ? 1 : 0,
          doc.sortOrder ?? 0,
          toDateTime(doc.createdAt),
          toDateTime(doc.updatedAt),
        ],
      );
    });

    await migrateCollectionInBatches(mongoDb.collection("business_hours_general"), async (doc) => {
      const { _id, ...schedule } = doc;
      await mysqlPool.query(
        `
          INSERT INTO business_hours_general (config_id, schedule)
          VALUES ('main', ?)
          ON DUPLICATE KEY UPDATE
            schedule = VALUES(schedule)
        `,
        [toJson(schedule)],
      );
    });

    await migrateCollectionInBatches(mongoDb.collection("business_hours_exceptions"), async (doc) => {
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
          doc.date,
          doc.endDate || null,
          doc.isOpen ? 1 : 0,
          doc.startTime || null,
          doc.endTime || null,
          doc.reason || null,
          toDateTime(doc.createdAt),
          toDateTime(doc.updatedAt),
        ],
      );
    });

    await migrateCollectionInBatches(mongoDb.collection("business_hours_holidays"), async (doc) => {
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
        [
          doc.date,
          doc.name,
          doc.isClosed ? 1 : 0,
          toDateTime(doc.createdAt),
          toDateTime(doc.updatedAt),
        ],
      );
    });

    await migrateCollectionInBatches(mongoDb.collection("cookie_consents"), async (doc) => {
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
          doc.anonymousVisitorId,
          doc.decision,
          doc.source,
          doc.policyVersion,
          doc.bannerVersion,
          doc.locale,
          toJson(doc.categories, {}),
          doc.ipHash || null,
          doc.userAgent || null,
          toDateTime(doc.choiceExpiresAt),
          toDateTime(doc.evidenceExpiresAt),
          toDateTime(doc.createdAt) || toDateTime(doc.updatedAt) || toDateTime(new Date()),
          toDateTime(doc.updatedAt) || toDateTime(doc.createdAt) || toDateTime(new Date()),
        ],
      );

      for (const entry of doc.history || []) {
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
            entry.id,
            doc.anonymousVisitorId,
            entry.decision,
            entry.source,
            entry.policyVersion,
            entry.bannerVersion,
            entry.locale,
            toJson(entry.categories, {}),
            entry.ipHash || null,
            entry.userAgent || null,
            toDateTime(entry.savedAt) || toDateTime(doc.updatedAt),
          ],
        );
      }
    });

    await migrateCollectionInBatches(mongoDb.collection("gift_cards"), async (doc) => {
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
          doc.id,
          doc.code || null,
          doc.amountEur,
          doc.original_amount ?? null,
          doc.status,
          doc.stripeSessionId || null,
          doc.stripePaymentIntentId || null,
          doc.buyer_firstname,
          doc.buyer_lastname,
          doc.buyer_email,
          doc.buyer_phone || null,
          doc.recipient_name || null,
          doc.personal_message || null,
          doc.coupon_token || null,
          toDateTime(doc.expiresAt),
          toDateTime(doc.redeemedAt),
          toDateTime(doc.createdAt) || toDateTime(new Date()),
          toDateTime(doc.updatedAt),
        ],
      );
    });

    await migrateCollectionInBatches(mongoDb.collection("payment_transactions"), async (doc) => {
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
          doc.id,
          doc.gift_card_id,
          doc.session_id,
          doc.amount,
          doc.original_amount ?? null,
          doc.currency,
          doc.status,
          doc.payment_status,
          doc.coupon_token || null,
          doc.coupon_data ? toJson(doc.coupon_data, null) : null,
          doc.metadata ? toJson(doc.metadata, null) : null,
          toDateTime(doc.created_at) || toDateTime(new Date()),
          toDateTime(doc.updated_at),
        ],
      );
    });

    await migrateCollectionInBatches(mongoDb.collection("coupons"), async (doc) => {
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
          doc.id,
          doc.code,
          doc.type,
          doc.value,
          doc.currency || "EUR",
          toDateTime(doc.validFrom),
          toDateTime(doc.validTo),
          doc.isActive ? 1 : 0,
          doc.maxUses ?? null,
          doc.currentUses ?? 0,
          toDateTime(doc.createdAt) || toDateTime(new Date()),
          toDateTime(doc.updatedAt),
        ],
      );
    });

    await migrateCollectionInBatches(mongoDb.collection("coupon_usages"), async (doc) => {
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
          doc.id,
          doc.coupon_code,
          doc.session_id || null,
          doc.gift_card_id || null,
          doc.validation_token,
          doc.status,
          toDateTime(doc.applied_at),
          toDateTime(doc.created_at) || toDateTime(new Date()),
          toDateTime(doc.updated_at),
        ],
      );
    });

    await migrateCollectionInBatches(mongoDb.collection("testimonials"), async (doc) => {
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
          doc.id,
          doc.name,
          doc.rating,
          doc.text,
          doc.service || null,
          doc.allowDisplay ? 1 : 0,
          doc.isApproved ? 1 : 0,
          toDateTime(doc.createdAt) || toDateTime(new Date()),
          toDateTime(doc.updatedAt),
        ],
      );
    });

    console.info("Migration MongoDB -> MySQL terminée.");
  } finally {
    await mongoClient.close();
    await mysqlPool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
