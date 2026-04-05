require("dotenv").config();

const crypto = require("crypto");
const cors = require("cors");
const express = require("express");
const Stripe = require("stripe");

const pricesSeed = require("./data/pricesSeed.json");
const holidaysSeed = require("./data/holidaysSeed.json");
const { sendGiftCardEmail } = require("./emailService");
const { createRequireAdmin } = require("./middleware/adminAuth");
const { createPricesService } = require("./services/pricesService");
const { createPricesController } = require("./controllers/pricesController");
const { createPricesRoutes } = require("./routes/pricesRoutes");
const { createCookieConsentService } = require("./services/cookieConsentService");
const { createCookieConsentController } = require("./controllers/cookieConsentController");
const { createCookieConsentRoutes } = require("./routes/cookieConsentRoutes");
const { createBusinessHoursService } = require("./services/businessHoursService");
const { createBusinessHoursController } = require("./controllers/businessHoursController");
const { createBusinessHoursRoutes } = require("./routes/businessHoursRoutes");
const { createGiftCardsService } = require("./services/giftCardsService");
const { createGiftCardsController } = require("./controllers/giftCardsController");
const { createGiftCardsRoutes } = require("./routes/giftCardsRoutes");
const { createCouponsService } = require("./services/couponsService");
const { createCouponsController } = require("./controllers/couponsController");
const { createCouponsRoutes } = require("./routes/couponsRoutes");
const { createTestimonialsService } = require("./services/testimonialsService");
const { createTestimonialsController } = require("./controllers/testimonialsController");
const { createTestimonialsRoutes } = require("./routes/testimonialsRoutes");
const { getSqlClient } = require("./sql/sqlClient");

const {
  engine: storageEngine,
  executeSchema,
  readRows,
  runSql,
  sqlBool,
  sqlJson,
  sqlValue,
  getSqliteDatabasePath,
} = getSqlClient();

const app = express();
const port = Number(process.env.PORT || 8000);

const adminPassword = process.env.ADMIN_PASSWORD;
const stripeApiKey = process.env.STRIPE_API_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const stripe = stripeApiKey ? new Stripe(stripeApiKey) : null;
const cookiePolicyVersion = String(process.env.COOKIE_POLICY_VERSION || "2026-03-28");
const cookieBannerVersion = String(process.env.COOKIE_BANNER_VERSION || cookiePolicyVersion);
const cookiePolicyLastUpdated = String(process.env.COOKIE_POLICY_LAST_UPDATED || cookiePolicyVersion);
const cookieConsentChoiceRetentionDays = Math.max(1, Number(process.env.COOKIE_CONSENT_CHOICE_RETENTION_DAYS || 180));
const cookieConsentEvidenceRetentionDays = Math.max(
  cookieConsentChoiceRetentionDays,
  Number(process.env.COOKIE_CONSENT_EVIDENCE_RETENTION_DAYS || 1095),
);
const cookieNecessaryRetentionLabel =
  String(process.env.COOKIE_NECESSARY_RETENTION_LABEL || "").trim()
  || "la durée de la session ou la durée strictement nécessaire au service demandé";
const cookieStripeRetentionLabel =
  String(process.env.COOKIE_STRIPE_RETENTION_LABEL || "").trim()
  || "la durée définie par Stripe pour ses traceurs techniques et de sécurité";
const defaultCookiePolicyConfig = {
  policyVersion: cookiePolicyVersion,
  bannerVersion: cookieBannerVersion,
  lastUpdated: cookiePolicyLastUpdated,
  choiceRetentionDays: cookieConsentChoiceRetentionDays,
  evidenceRetentionDays: cookieConsentEvidenceRetentionDays,
  necessaryRetentionLabel: cookieNecessaryRetentionLabel,
  stripeRetentionLabel: cookieStripeRetentionLabel,
  analyticsProvider: String(process.env.ANALYTICS_PROVIDER || "google-analytics-4"),
  analyticsMeasurementId: String(process.env.GA_MEASUREMENT_ID || "").trim(),
  analyticsEnabled: Boolean(String(process.env.GA_MEASUREMENT_ID || "").trim()),
};

const defaultBusinessHours = {
  0: { morningOpen: null, morningClose: null, afternoonOpen: null, afternoonClose: null },
  1: { morningOpen: null, morningClose: null, afternoonOpen: "14:00", afternoonClose: "18:30" },
  2: { morningOpen: "09:00", morningClose: "12:00", afternoonOpen: "14:00", afternoonClose: "18:30" },
  3: { morningOpen: null, morningClose: null, afternoonOpen: null, afternoonClose: null },
  4: { morningOpen: "09:00", morningClose: "12:00", afternoonOpen: "14:00", afternoonClose: "18:30" },
  5: { morningOpen: "09:00", morningClose: "12:00", afternoonOpen: "14:00", afternoonClose: "18:30" },
  6: { morningOpen: "09:00", morningClose: "12:00", afternoonOpen: "14:00", afternoonClose: "16:00" },
};

const corsOrigins = (process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (corsOrigins.includes("*") || !origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));
app.use(express.json());

function nowIso() {
  return new Date().toISOString();
}

function badRequest(res, detail) {
  return res.status(400).json({ detail });
}

function unauthorized(res) {
  return res.status(401).json({ detail: "Unauthorized" });
}

function notFound(res, detail) {
  return res.status(404).json({ detail });
}

function ensureAdmin(req, res) {
  if (req.headers.authorization !== adminPassword) {
    unauthorized(res);
    return false;
  }
  return true;
}

function randomId() {
  return crypto.randomUUID();
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function escapeLike(value) {
  return String(value || "").replace(/[%_]/g, "\\$&");
}

function addDaysToIso(days) {
  return new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000).toISOString();
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

function normalizeCookiePolicyConfig(config = {}) {
  const choiceRetentionDays = normalizePositiveInteger(
    config.choiceRetentionDays,
    defaultCookiePolicyConfig.choiceRetentionDays,
  );

  return {
    policyVersion: String(config.policyVersion || defaultCookiePolicyConfig.policyVersion),
    bannerVersion: String(config.bannerVersion || defaultCookiePolicyConfig.bannerVersion),
    lastUpdated: String(config.lastUpdated || defaultCookiePolicyConfig.lastUpdated),
    choiceRetentionDays,
    evidenceRetentionDays: Math.max(
      choiceRetentionDays,
      normalizePositiveInteger(
        config.evidenceRetentionDays,
        defaultCookiePolicyConfig.evidenceRetentionDays,
      ),
    ),
    necessaryRetentionLabel:
      String(config.necessaryRetentionLabel || "").trim()
      || defaultCookiePolicyConfig.necessaryRetentionLabel,
    stripeRetentionLabel:
      String(config.stripeRetentionLabel || "").trim()
      || defaultCookiePolicyConfig.stripeRetentionLabel,
    analyticsProvider:
      String(config.analyticsProvider || defaultCookiePolicyConfig.analyticsProvider).trim()
      || defaultCookiePolicyConfig.analyticsProvider,
    analyticsMeasurementId: String(config.analyticsMeasurementId || "").trim(),
    analyticsEnabled:
      Boolean(config.analyticsEnabled)
      && Boolean(String(config.analyticsMeasurementId || "").trim()),
  };
}

function normalizeConsentCategories(categories = {}) {
  return {
    necessary: true,
    preferences: Boolean(categories.preferences),
    analytics: Boolean(categories.analytics),
    marketing: Boolean(categories.marketing),
  };
}

function generateGiftCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `LB-${part()}-${part()}`;
}

function normalizeIsoDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(String(value).replace("Z", "+00:00"));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function isCurrentlyOpen(hours) {
  if (!hours?.open || !hours?.close) {
    return false;
  }

  const [openHour, openMinute] = String(hours.open).split(":").map(Number);
  const [closeHour, closeMinute] = String(hours.close).split(":").map(Number);

  if ([openHour, openMinute, closeHour, closeMinute].some((value) => Number.isNaN(value))) {
    return false;
  }

  const current = new Date();
  const currentMinutes = current.getHours() * 60 + current.getMinutes();
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

function normalizeCategoryPreferences(allCategories, categoryOrder = [], selectedCategories = []) {
  const uniqueCategories = [...new Set(allCategories.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );

  const sanitizedOrder = [];
  for (const category of categoryOrder) {
    if (uniqueCategories.includes(category) && !sanitizedOrder.includes(category)) {
      sanitizedOrder.push(category);
    }
  }

  const finalOrder = [...sanitizedOrder, ...uniqueCategories.filter((item) => !sanitizedOrder.includes(item))];
  const sanitizedSelectedSource = selectedCategories.length > 0 ? selectedCategories : finalOrder;
  const sanitizedSelected = [];

  for (const category of sanitizedSelectedSource) {
    if (finalOrder.includes(category) && !sanitizedSelected.includes(category)) {
      sanitizedSelected.push(category);
    }
  }

  return {
    categoryOrder: finalOrder,
    selectedCategoriesForPdf: sanitizedSelected,
  };
}

function readOne(sql) {
  const rows = readRows(sql);
  return rows[0] || null;
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapPriceRow(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    priceEur: row.price_eur === null ? null : Number(row.price_eur),
    durationMin: row.duration_min === null ? null : Number(row.duration_min),
    note: row.note,
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order || 0),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function mapCouponRow(row) {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value === null ? null : Number(row.value),
    currency: row.currency,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    maxUses: row.max_uses === null ? null : Number(row.max_uses),
    currentUses: Number(row.current_uses || 0),
    updatedAt: row.updated_at || null,
  };
}

function mapGiftCardRow(row) {
  return {
    id: row.id,
    code: row.code,
    amountEur: row.amount_eur === null ? null : Number(row.amount_eur),
    original_amount: row.original_amount === null ? null : Number(row.original_amount),
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    redeemedAt: row.redeemed_at,
    stripeSessionId: row.stripe_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    buyer_firstname: row.buyer_firstname,
    buyer_lastname: row.buyer_lastname,
    buyer_email: row.buyer_email,
    buyer_phone: row.buyer_phone,
    recipient_name: row.recipient_name,
    personal_message: row.personal_message,
    coupon_token: row.coupon_token,
    updatedAt: row.updated_at || null,
  };
}

function mapTestimonialRow(row) {
  return {
    id: row.id,
    name: row.name,
    rating: Number(row.rating),
    text: row.text,
    service: row.service,
    allowDisplay: Boolean(row.allow_display),
    isApproved: Boolean(row.is_approved),
    createdAt: row.created_at,
    updatedAt: row.updated_at || null,
  };
}

function mapConsentRow(row, history = []) {
  return {
    anonymousVisitorId: row.anonymous_visitor_id,
    categories: parseJson(row.categories ?? row.categories_json, {}),
    decision: row.decision,
    source: row.source,
    policyVersion: row.policy_version,
    bannerVersion: row.banner_version,
    locale: row.locale,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    choiceExpiresAt: row.choice_expires_at,
    evidenceExpiresAt: row.evidence_expires_at,
    ipHash: row.ip_hash,
    userAgent: row.user_agent,
    history,
  };
}

function sortPricesWithCategoryOrder(prices, categoryOrder = []) {
  const normalizedOrder = categoryOrder.map((item) => String(item).toLowerCase());

  return [...prices].sort((left, right) => {
    const leftCategory = String(left.category || "");
    const rightCategory = String(right.category || "");
    const leftIndex = normalizedOrder.indexOf(leftCategory.toLowerCase());
    const rightIndex = normalizedOrder.indexOf(rightCategory.toLowerCase());
    const safeLeftIndex = leftIndex === -1 ? normalizedOrder.length : leftIndex;
    const safeRightIndex = rightIndex === -1 ? normalizedOrder.length : rightIndex;

    if (safeLeftIndex !== safeRightIndex) {
      return safeLeftIndex - safeRightIndex;
    }

    if (leftCategory !== rightCategory) {
      return leftCategory.localeCompare(rightCategory, "fr");
    }

    const leftSort = Number.isInteger(left.sortOrder) ? left.sortOrder : 0;
    const rightSort = Number.isInteger(right.sortOrder) ? right.sortOrder : 0;

    if (leftSort !== rightSort) {
      return leftSort - rightSort;
    }

    return String(left.name || "").localeCompare(String(right.name || ""), "fr");
  });
}

function getAdminSetting(key) {
  const row = readOne(`SELECT \`value\` FROM admin_settings WHERE \`key\` = ${sqlValue(key)} LIMIT 1;`);
  return row ? parseJson(row.value, null) : null;
}

function setAdminSetting(key, value) {
  runSql(`
    INSERT INTO admin_settings (\`key\`, \`value\`, updated_at)
    VALUES (${sqlValue(key)}, ${sqlJson(value, null)}, CURRENT_TIMESTAMP)
    ON CONFLICT(\`key\`) DO UPDATE SET
      \`value\` = excluded.value,
      updated_at = CURRENT_TIMESTAMP;
  `);
}

async function getCookiePolicyConfig() {
  const savedConfig = getAdminSetting("cookie_policy_config");
  return normalizeCookiePolicyConfig(savedConfig || defaultCookiePolicyConfig);
}

function getPriceRows(activeOnly = false) {
  const where = activeOnly ? "WHERE is_active = 1" : "";
  return readRows(`SELECT * FROM price_items ${where};`).map(mapPriceRow);
}

function getNormalizedPriceCategoryPreferences() {
  const allCategories = getPriceRows(false).map((item) => item.category).filter(Boolean);
  const savedPreferences = getAdminSetting("price_category_preferences");
  const normalizedPreferences = normalizeCategoryPreferences(
    allCategories,
    savedPreferences?.categoryOrder || [],
    savedPreferences?.selectedCategoriesForPdf || [],
  );
  setAdminSetting("price_category_preferences", normalizedPreferences);
  return normalizedPreferences;
}

function getConsentHistory(visitorId) {
  return readRows(`
    SELECT * FROM cookie_consent_history
    WHERE anonymous_visitor_id = ${sqlValue(visitorId)}
    ORDER BY saved_at DESC;
  `).map((row) => ({
    id: row.id,
    decision: row.decision,
    categories: parseJson(row.categories ?? row.categories_json, {}),
    source: row.source,
    policyVersion: row.policy_version,
    bannerVersion: row.banner_version,
    locale: row.locale,
    savedAt: row.saved_at,
    ipHash: row.ip_hash,
    userAgent: row.user_agent,
  }));
}

function getConsentByVisitorId(visitorId) {
  const row = readOne(`
    SELECT * FROM cookie_consents
    WHERE anonymous_visitor_id = ${sqlValue(visitorId)}
    LIMIT 1;
  `);
  if (!row) {
    return null;
  }
  return mapConsentRow(row, getConsentHistory(visitorId));
}

function getCouponUsageByToken(token) {
  const row = readOne(`
    SELECT * FROM coupon_usages
    WHERE validation_token = ${sqlValue(token)}
    LIMIT 1;
  `);
  return row || null;
}

function getCouponByCode(code) {
  const row = readOne(`SELECT * FROM coupons WHERE code = ${sqlValue(code)} LIMIT 1;`);
  return row ? mapCouponRow(row) : null;
}

function getGiftCardById(id) {
  const row = readOne(`SELECT * FROM gift_cards WHERE id = ${sqlValue(id)} LIMIT 1;`);
  return row ? mapGiftCardRow(row) : null;
}

function getGiftCardByCode(code) {
  const row = readOne(`SELECT * FROM gift_cards WHERE code = ${sqlValue(code)} LIMIT 1;`);
  return row ? mapGiftCardRow(row) : null;
}

function getPaymentTransactionBySessionId(sessionId) {
  return readOne(`SELECT * FROM payment_transactions WHERE session_id = ${sqlValue(sessionId)} LIMIT 1;`);
}

function seedDatabase() {
  executeSchema();

  const pricesCount = Number(readOne("SELECT COUNT(*) AS count FROM price_items;")?.count || 0);
  if (pricesCount === 0) {
    for (const item of pricesSeed) {
      runSql(`
        INSERT INTO price_items (
          id, category, name, price_eur, duration_min, note, is_active, sort_order, created_at, updated_at
        ) VALUES (
          ${sqlValue(item.id || randomId())},
          ${sqlValue(item.category)},
          ${sqlValue(item.name)},
          ${sqlValue(item.priceEur ?? null)},
          ${sqlValue(item.durationMin ?? null)},
          ${sqlValue(item.note ?? null)},
          ${sqlBool(item.isActive ?? true)},
          ${sqlValue(item.sortOrder ?? 0)},
          ${sqlValue(nowIso())},
          ${sqlValue(nowIso())}
        );
      `);
    }
    console.info(`Tarifs ${storageEngine.toUpperCase()} initialisés: ${pricesSeed.length}`);
  }

  const holidaysCount = Number(readOne("SELECT COUNT(*) AS count FROM business_hours_holidays;")?.count || 0);
  if (holidaysCount === 0) {
    for (const item of holidaysSeed) {
      runSql(`
        INSERT INTO business_hours_holidays (date, name, is_closed, created_at, updated_at)
        VALUES (
          ${sqlValue(item.date)},
          ${sqlValue(item.name)},
          1,
          ${sqlValue(nowIso())},
          ${sqlValue(nowIso())}
        );
      `);
    }
    console.info(`Jours fériés ${storageEngine.toUpperCase()} initialisés: ${holidaysSeed.length}`);
  }
}

async function activateGiftCardAfterPayment({ giftCardId, sessionId, couponToken }) {
  const existingGiftCard = getGiftCardById(giftCardId);
  if (!existingGiftCard) {
    throw new Error("Gift card not found after payment");
  }

  if (existingGiftCard.status === "active" && existingGiftCard.code) {
    return existingGiftCard;
  }

  const code = generateGiftCode();
  const expiresAt = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString();

  if (couponToken) {
    const couponUsage = getCouponUsageByToken(couponToken);
    if (couponUsage) {
      runSql(`
        UPDATE coupon_usages
        SET
          status = 'applied',
          session_id = ${sqlValue(sessionId)},
          applied_at = ${sqlValue(nowIso())},
          gift_card_id = ${sqlValue(giftCardId)},
          updated_at = CURRENT_TIMESTAMP
        WHERE validation_token = ${sqlValue(couponToken)};
      `);

      if (["pending", "applied-pending"].includes(couponUsage.status)) {
        runSql(`
          UPDATE coupons
          SET current_uses = current_uses + 1, updated_at = CURRENT_TIMESTAMP
          WHERE code = ${sqlValue(couponUsage.coupon_code)};
        `);
      }
    }
  }

  runSql(`
    UPDATE gift_cards
    SET
      code = ${sqlValue(code)},
      status = 'active',
      expires_at = ${sqlValue(expiresAt)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${sqlValue(giftCardId)};
  `);

  runSql(`
    UPDATE payment_transactions
    SET payment_status = 'paid', status = 'complete', updated_at = CURRENT_TIMESTAMP
    WHERE session_id = ${sqlValue(sessionId)};
  `);

  const giftCard = getGiftCardById(giftCardId);

  const buyerName = `${giftCard.buyer_firstname} ${giftCard.buyer_lastname}`.trim();
  await sendGiftCardEmail({
    toEmail: giftCard.buyer_email,
    recipientName: giftCard.recipient_name || buyerName,
    giftCardCode: giftCard.code,
    amount: giftCard.amountEur,
    expiresAt: giftCard.expiresAt,
    buyerName,
  });

  return giftCard;
}

app.get("/api/", (req, res) => {
  res.json({
    message: "Léa Beauté Valognes API",
    storage: storageEngine,
    sqlitePath: storageEngine === "sqlite" ? getSqliteDatabasePath() : null,
  });
});
const requireAdmin = createRequireAdmin({ adminPassword });

const pricesService = createPricesService({
  getPriceRows,
  getNormalizedPriceCategoryPreferences,
  sortPricesWithCategoryOrder,
  normalizeCategoryPreferences,
  setAdminSetting,
  randomId,
  runSql,
  sqlBool,
  sqlValue,
  nowIso,
  readOne,
  mapPriceRow,
});
const pricesController = createPricesController({ pricesService });

const cookieConsentService = createCookieConsentService({
  getCookiePolicyConfig,
  normalizeCookiePolicyConfig,
  defaultCookiePolicyConfig,
  setAdminSetting,
  getConsentByVisitorId,
  escapeLike,
  sqlValue,
  readRows,
  parseJson,
  normalizeConsentCategories,
  nowIso,
  sha256,
  addDaysToIso,
  sqlJson,
  runSql,
  randomId,
});
const cookieConsentController = createCookieConsentController({ cookieConsentService });

const businessHoursService = createBusinessHoursService({
  readOne,
  readRows,
  runSql,
  sqlJson,
  sqlValue,
  sqlBool,
  parseJson,
  defaultBusinessHours,
  isCurrentlyOpen,
});
const businessHoursController = createBusinessHoursController({ businessHoursService });

const giftCardsService = createGiftCardsService({
  stripe,
  stripeWebhookSecret,
  nowIso,
  randomId,
  runSql,
  readRows,
  sqlJson,
  sqlValue,
  getCouponUsageByToken,
  getCouponByCode,
  getGiftCardById,
  getGiftCardByCode,
  getPaymentTransactionBySessionId,
  escapeLike,
  mapGiftCardRow,
  activateGiftCardAfterPayment,
  generateGiftCode,
  normalizeIsoDate,
  sendGiftCardEmail,
});
const giftCardsController = createGiftCardsController({ giftCardsService });

const couponsService = createCouponsService({
  readRows,
  readOne,
  runSql,
  sqlBool,
  sqlValue,
  nowIso,
  randomId,
  normalizeIsoDate,
  getCouponByCode,
  getCouponUsageByToken,
  mapCouponRow,
});
const couponsController = createCouponsController({ couponsService });

const testimonialsService = createTestimonialsService({
  randomId,
  nowIso,
  runSql,
  sqlValue,
  sqlBool,
  readRows,
  mapTestimonialRow,
});
const testimonialsController = createTestimonialsController({ testimonialsService });

app.use("/api", createCookieConsentRoutes({ cookieConsentController, requireAdmin }));
app.use("/api", createPricesRoutes({ pricesController, requireAdmin }));
app.use("/api", createGiftCardsRoutes({ giftCardsController, requireAdmin }));
app.use("/api", createBusinessHoursRoutes({ businessHoursController, requireAdmin }));
app.use("/api", createCouponsRoutes({ couponsController, requireAdmin }));
app.use("/api", createTestimonialsRoutes({ testimonialsController }));

app.post("/api/admin/login", (req, res) => {
  if (req.body.password === adminPassword) {
    res.json({ success: true, token: adminPassword });
    return;
  }
  res.status(401).json({ detail: "Invalid password" });
});

app.get("/api/google-reviews", async (req, res, next) => {
  try {
    const placeId = process.env.GOOGLE_PLACE_ID;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!placeId || !apiKey) {
      return res.json({
        name: "Léa Beauté",
        rating: 4.8,
        user_ratings_total: 0,
        reviews: [],
      });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", "name,rating,user_ratings_total,reviews");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", "fr");

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error(`Google Places API error: ${data.status}`);
      return res.json({
        name: "Léa Beauté",
        rating: 4.8,
        user_ratings_total: 0,
        reviews: [],
      });
    }

    const result = data.result || {};
    res.json({
      name: result.name,
      rating: result.rating,
      user_ratings_total: result.user_ratings_total,
      reviews: (result.reviews || []).slice(0, 5).map((review) => ({
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.time,
        relative_time: review.relative_time_description,
        profile_photo: review.profile_photo_url,
        author_url: review.author_url,
        reply: review.reply
          ? {
              text: review.reply.comment,
              time: review.reply.time,
            }
          : null,
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  const statusCode = Number(error?.status);
  const safeStatus = Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599
    ? statusCode
    : 500;
  res.status(safeStatus).json({ detail: error.message || "Internal server error" });
});

async function start() {
  seedDatabase();

  app.listen(port, () => {
    console.info(`API Node ${storageEngine.toUpperCase()} démarrée sur le port ${port}`);
    if (storageEngine === "sqlite") {
      console.info(`SQLite local: ${getSqliteDatabasePath()}`);
    }
  });
}

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
