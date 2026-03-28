require("dotenv").config();

const crypto = require("crypto");
const cors = require("cors");
const express = require("express");
const { MongoClient } = require("mongodb");
const Stripe = require("stripe");

const pricesSeed = require("./data/pricesSeed.json");
const holidaysSeed = require("./data/holidaysSeed.json");
const { sendGiftCardEmail } = require("./emailService");

const app = express();
const port = Number(process.env.PORT || 8000);

const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;
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
  0: { open: null, close: null },
  1: { open: "14:00", close: "18:30" },
  2: { open: "09:00", close: "18:30" },
  3: { open: null, close: null },
  4: { open: "09:00", close: "18:30" },
  5: { open: "09:00", close: "18:30" },
  6: { open: "09:00", close: "16:00" },
};

const corsOrigins = (process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

let mongoClient;
let db;

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

function getCollection(name) {
  return db.collection(name);
}

function sanitizeDoc(document) {
  if (!document) {
    return null;
  }

  const { _id, ...rest } = document;
  return rest;
}

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

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

async function getCookiePolicyConfig() {
  const savedConfig = await getCollection("admin_settings").findOne(
    { key: "cookie_policy_config" },
    { projection: { _id: 0 } },
  );

  return normalizeCookiePolicyConfig(savedConfig || defaultCookiePolicyConfig);
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

async function getNormalizedPriceCategoryPreferences() {
  const prices = await getCollection("price_items")
    .find({}, { projection: { _id: 0, category: 1 } })
    .toArray();
  const allCategories = prices.map((item) => item.category).filter(Boolean);
  const savedPreferences = await getCollection("admin_settings").findOne(
    { key: "price_category_preferences" },
    { projection: { _id: 0 } },
  );

  const normalizedPreferences = normalizeCategoryPreferences(
    allCategories,
    savedPreferences?.categoryOrder || [],
    savedPreferences?.selectedCategoriesForPdf || [],
  );

  await getCollection("admin_settings").updateOne(
    { key: "price_category_preferences" },
    { $set: { key: "price_category_preferences", ...normalizedPreferences } },
    { upsert: true },
  );

  return normalizedPreferences;
}

async function seedDatabase() {
  const pricesCount = await getCollection("price_items").countDocuments({});
  if (pricesCount === 0) {
    await getCollection("price_items").insertMany(
      pricesSeed.map((item) => ({
        id: item.id || randomId(),
        ...item,
      })),
    );
    console.info(`Tarifs initialisés: ${pricesSeed.length}`);
  }

  const holidaysCount = await getCollection("business_hours_holidays").countDocuments({});
  if (holidaysCount === 0) {
    await getCollection("business_hours_holidays").insertMany(
      holidaysSeed.map((item) => ({
        date: item.date,
        name: item.name,
        isClosed: true,
      })),
    );
    console.info(`Jours fériés initialisés: ${holidaysSeed.length}`);
  }
}

async function activateGiftCardAfterPayment({ giftCardId, sessionId, couponToken }) {
  const giftCards = getCollection("gift_cards");
  const couponUsages = getCollection("coupon_usages");
  const coupons = getCollection("coupons");
  const paymentTransactions = getCollection("payment_transactions");

  const existingGiftCard = await giftCards.findOne({ id: giftCardId }, { projection: { _id: 0 } });
  if (!existingGiftCard) {
    throw new Error("Gift card not found after payment");
  }

  if (existingGiftCard.status === "active" && existingGiftCard.code) {
    return existingGiftCard;
  }

  const code = generateGiftCode();
  const expiresAt = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString();

  if (couponToken) {
    const couponUsage = await couponUsages.findOne({ validation_token: couponToken });
    if (couponUsage) {
      await couponUsages.updateOne(
        { validation_token: couponToken },
        {
          $set: {
            status: "applied",
            session_id: sessionId,
            applied_at: nowIso(),
            gift_card_id: giftCardId,
          },
        },
      );

      if (["pending", "applied-pending"].includes(couponUsage.status)) {
        await coupons.updateOne({ code: couponUsage.coupon_code }, { $inc: { currentUses: 1 } });
      }
    }
  }

  await giftCards.updateOne(
    { id: giftCardId },
    {
      $set: {
        code,
        status: "active",
        expiresAt,
      },
    },
  );

  await paymentTransactions.updateOne(
    { session_id: sessionId },
    { $set: { payment_status: "paid", status: "complete" } },
  );

  const giftCard = await giftCards.findOne({ id: giftCardId }, { projection: { _id: 0 } });

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
  res.json({ message: "Léa Beauté Valognes API" });
});

app.get("/api/cookie-policy-config", (req, res) => {
  getCookiePolicyConfig()
    .then((config) => res.json(config))
    .catch((error) => res.status(500).json({ detail: error.message || "Internal server error" }));
});

app.put("/api/admin/cookie-policy-config", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const normalizedConfig = normalizeCookiePolicyConfig({
      ...defaultCookiePolicyConfig,
      ...req.body,
      lastUpdated: req.body.lastUpdated || new Date().toISOString().slice(0, 10),
    });

    await getCollection("admin_settings").updateOne(
      { key: "cookie_policy_config" },
      { $set: { key: "cookie_policy_config", ...normalizedConfig } },
      { upsert: true },
    );

    res.json(await getCookiePolicyConfig());
  } catch (error) {
    next(error);
  }
});

app.get("/api/cookie-consent/:visitorId", async (req, res, next) => {
  try {
    const consent = await getCollection("cookie_consents").findOne(
      { anonymousVisitorId: req.params.visitorId },
      { projection: { _id: 0 } },
    );

    if (!consent) {
      return notFound(res, "Consent record not found");
    }

    res.json(consent);
  } catch (error) {
    next(error);
  }
});

app.get("/api/cookie-consents", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const search = String(req.query.search || "").trim();
    const limit = Math.max(1, Math.min(Number(req.query.limit || 200), 1000));
    const safeSearch = escapeRegex(search);
    const query = safeSearch
      ? {
          $or: [
            { anonymousVisitorId: { $regex: safeSearch, $options: "i" } },
            { decision: { $regex: safeSearch, $options: "i" } },
            { source: { $regex: safeSearch, $options: "i" } },
            { policyVersion: { $regex: safeSearch, $options: "i" } },
            { userAgent: { $regex: safeSearch, $options: "i" } },
          ],
        }
      : {};

    const items = await getCollection("cookie_consents")
      .aggregate([
        { $match: query },
        {
          $project: {
            _id: 0,
            anonymousVisitorId: 1,
            categories: 1,
            decision: 1,
            source: 1,
            policyVersion: 1,
            updatedAt: 1,
            historyCount: {
              $size: { $ifNull: ["$history", []] },
            },
          },
        },
        { $sort: { updatedAt: -1 } },
        { $limit: limit },
      ])
      .toArray();

    res.json({ items, count: items.length });
  } catch (error) {
    next(error);
  }
});

app.post("/api/cookie-consent", async (req, res, next) => {
  try {
    const anonymousVisitorId = String(req.body.anonymousVisitorId || "").trim();
    if (!anonymousVisitorId) {
      return badRequest(res, "anonymousVisitorId is required");
    }

    const categories = normalizeConsentCategories(req.body.categories || {});
    const source = String(req.body.source || "banner");
    const cookiePolicyConfig = await getCookiePolicyConfig();
    const policyVersion = String(req.body.policyVersion || cookiePolicyConfig.policyVersion);
    const bannerVersion = String(req.body.bannerVersion || cookiePolicyConfig.bannerVersion);
    const locale = String(req.body.locale || "fr-FR");
    const decision =
      categories.preferences || categories.analytics || categories.marketing
        ? "custom-or-accepted"
        : "necessary-only";

    const now = nowIso();
    const forwardedIp = req.headers["x-forwarded-for"];
    const rawIp = Array.isArray(forwardedIp) ? forwardedIp[0] : (forwardedIp || req.ip || "");
    const ipHash = rawIp ? sha256(rawIp).slice(0, 32) : null;
    const userAgent = String(req.headers["user-agent"] || "").slice(0, 255);

    const historyEntry = {
      id: randomId(),
      decision,
      categories,
      source,
      policyVersion,
      bannerVersion,
      locale,
      savedAt: now,
      ipHash,
      userAgent,
    };

    await getCollection("cookie_consents").updateOne(
      { anonymousVisitorId },
      {
        $set: {
          anonymousVisitorId,
          categories,
          decision,
          source,
          policyVersion,
          bannerVersion,
          locale,
          updatedAt: now,
          choiceExpiresAt: addDaysToIso(cookiePolicyConfig.choiceRetentionDays),
          evidenceExpiresAt: addDaysToIso(cookiePolicyConfig.evidenceRetentionDays),
          ipHash,
          userAgent,
        },
        $setOnInsert: {
          createdAt: now,
        },
        $push: {
          history: historyEntry,
        },
      },
      { upsert: true },
    );

    const savedConsent = await getCollection("cookie_consents").findOne(
      { anonymousVisitorId },
      { projection: { _id: 0 } },
    );

    res.json(savedConsent);
  } catch (error) {
    next(error);
  }
});

app.get("/api/prices", async (req, res, next) => {
  try {
    const prices = await getCollection("price_items")
      .find({ isActive: true }, { projection: { _id: 0 } })
      .toArray();
    const preferences = await getNormalizedPriceCategoryPreferences();
    res.json(sortPricesWithCategoryOrder(prices, preferences.categoryOrder));
  } catch (error) {
    next(error);
  }
});

app.get("/api/prices/all", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const prices = await getCollection("price_items").find({}, { projection: { _id: 0 } }).toArray();
    const preferences = await getNormalizedPriceCategoryPreferences();
    res.json(sortPricesWithCategoryOrder(prices, preferences.categoryOrder));
  } catch (error) {
    next(error);
  }
});

app.get("/api/prices/category-preferences", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    res.json(await getNormalizedPriceCategoryPreferences());
  } catch (error) {
    next(error);
  }
});

app.put("/api/prices/category-preferences", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const prices = await getCollection("price_items")
      .find({}, { projection: { _id: 0, category: 1 } })
      .toArray();
    const normalizedPreferences = normalizeCategoryPreferences(
      prices.map((item) => item.category),
      req.body.categoryOrder || [],
      req.body.selectedCategoriesForPdf || [],
    );

    await getCollection("admin_settings").updateOne(
      { key: "price_category_preferences" },
      { $set: { key: "price_category_preferences", ...normalizedPreferences } },
      { upsert: true },
    );

    res.json(normalizedPreferences);
  } catch (error) {
    next(error);
  }
});

app.post("/api/prices", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const item = {
      id: req.body.id || randomId(),
      category: req.body.category,
      name: req.body.name,
      priceEur: req.body.priceEur ?? null,
      durationMin: req.body.durationMin ?? null,
      note: req.body.note ?? null,
      isActive: req.body.isActive ?? true,
      sortOrder: req.body.sortOrder ?? 0,
    };
    await getCollection("price_items").insertOne(item);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

app.put("/api/prices/:itemId", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const updateData = Object.fromEntries(
      Object.entries({
        category: req.body.category,
        name: req.body.name,
        priceEur: req.body.priceEur,
        durationMin: req.body.durationMin,
        note: req.body.note,
        isActive: req.body.isActive,
        sortOrder: req.body.sortOrder,
      }).filter(([, value]) => value !== undefined),
    );

    if (Object.keys(updateData).length === 0) {
      return badRequest(res, "No fields to update");
    }

    await getCollection("price_items").updateOne({ id: req.params.itemId }, { $set: updateData });
    const updated = await getCollection("price_items").findOne(
      { id: req.params.itemId },
      { projection: { _id: 0 } },
    );

    if (!updated) {
      return notFound(res, "Price item not found");
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/prices/:itemId", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const result = await getCollection("price_items").deleteOne({ id: req.params.itemId });
    if (result.deletedCount === 0) {
      return notFound(res, "Price item not found");
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/login", (req, res) => {
  if (req.body.password === adminPassword) {
    res.json({ success: true, token: adminPassword });
    return;
  }
  res.status(401).json({ detail: "Invalid password" });
});

app.post("/api/gift-cards/create-checkout", async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(501).json({ detail: "Stripe API key not configured." });
    }

    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 10 || amount > 500) {
      return badRequest(res, "Invalid gift card amount");
    }

    let finalAmount = amount;
    let couponData = null;
    let couponToken = null;

    if (req.body.coupon_token) {
      const couponUsage = await getCollection("coupon_usages").findOne({
        validation_token: req.body.coupon_token,
      });

      if (!couponUsage) {
        return badRequest(res, "Invalid coupon token");
      }

      if (couponUsage.status !== "pending") {
        return badRequest(res, "Coupon already used or invalid");
      }

      const coupon = await getCollection("coupons").findOne({ code: couponUsage.coupon_code });
      if (!coupon) {
        return badRequest(res, "Coupon not found");
      }

      finalAmount =
        coupon.type === "percentage"
          ? Math.max(0, amount - (amount * Number(coupon.value)) / 100)
          : Math.max(0, amount - Number(coupon.value));

      couponData = {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount_amount: amount - finalAmount,
      };
      couponToken = req.body.coupon_token;

      await getCollection("coupon_usages").updateOne(
        { validation_token: couponToken },
        { $set: { status: "applied-pending" } },
      );
    }

    const giftCardId = randomId();
    await getCollection("gift_cards").insertOne({
      id: giftCardId,
      code: null,
      amountEur: finalAmount,
      status: "pending",
      createdAt: nowIso(),
      expiresAt: null,
      stripeSessionId: null,
      stripePaymentIntentId: null,
      buyer_firstname: req.body.buyer_firstname,
      buyer_lastname: req.body.buyer_lastname,
      buyer_email: req.body.buyer_email,
      buyer_phone: req.body.buyer_phone,
      recipient_name: req.body.recipient_name || null,
      personal_message: req.body.personal_message || null,
      coupon_token: couponToken,
      original_amount: amount,
    });

    try {
      const successUrl = `${req.body.origin_url}/gift-card-success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${req.body.origin_url}/#cartes-cadeaux`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `Carte cadeau Léa Beauté ${amount}€`,
                description: "Carte cadeau valable 2 ans",
              },
              unit_amount: Math.round(finalAmount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          gift_card_id: giftCardId,
          amount_eur: String(finalAmount),
          original_amount_eur: String(amount),
          coupon_code: couponData?.code || "",
        },
      });

      await getCollection("gift_cards").updateOne(
        { id: giftCardId },
        { $set: { stripeSessionId: session.id } },
      );

      await getCollection("payment_transactions").insertOne({
        id: randomId(),
        gift_card_id: giftCardId,
        session_id: session.id,
        amount: finalAmount,
        original_amount: amount,
        currency: "eur",
        status: "pending",
        payment_status: "pending",
        coupon_token: couponToken,
        coupon_data: couponData,
        created_at: nowIso(),
        metadata: { gift_card_id: giftCardId },
      });

      res.json({ url: session.url, session_id: session.id });
    } catch (error) {
      await getCollection("gift_cards").deleteOne({ id: giftCardId });
      if (couponToken) {
        await getCollection("coupon_usages").updateOne(
          { validation_token: couponToken },
          { $set: { status: "pending" } },
        );
      }

      if (error?.type?.startsWith("Stripe")) {
        return res.status(400).json({ detail: `Stripe error: ${error.message}` });
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
});

app.get("/api/gift-cards/status/:sessionId", async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(501).json({ detail: "Stripe API key not configured." });
    }

    const transaction = await getCollection("payment_transactions").findOne({
      session_id: req.params.sessionId,
    });

    if (!transaction) {
      return notFound(res, "Transaction not found");
    }

    if (transaction.payment_status === "paid") {
      const activeGiftCard = await getCollection("gift_cards").findOne(
        { id: transaction.gift_card_id },
        { projection: { _id: 0 } },
      );
      return res.json({
        payment_status: "paid",
        status: "complete",
        gift_card: activeGiftCard,
      });
    }

    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    const paymentStatus = session.payment_status === "paid" ? "paid" : session.payment_status || "pending";

    await getCollection("payment_transactions").updateOne(
      { session_id: req.params.sessionId },
      { $set: { payment_status: paymentStatus, status: session.status } },
    );

    if (paymentStatus === "paid") {
      const giftCard = await activateGiftCardAfterPayment({
        giftCardId: transaction.gift_card_id,
        sessionId: req.params.sessionId,
        couponToken: transaction.coupon_token,
      });

      return res.json({
        payment_status: "paid",
        status: "complete",
        gift_card: giftCard,
      });
    }

    res.json({
      payment_status: paymentStatus,
      status: session.status,
      gift_card: null,
    });
  } catch (error) {
    if (error?.type?.startsWith("Stripe")) {
      res.status(400).json({ detail: `Stripe error: ${error.message}` });
      return;
    }
    next(error);
  }
});

app.post("/api/webhooks/stripe", async (req, res, next) => {
  try {
    if (!stripe || !stripeWebhookSecret) {
      return res.status(400).json({ detail: "Invalid signature" });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        stripeWebhookSecret,
      );
    } catch (error) {
      return res.status(400).json({ detail: "Invalid signature" });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await getCollection("payment_transactions").updateOne(
        { session_id: session.id },
        { $set: { payment_status: "paid", status: "complete" } },
      );
    }

    res.json({ status: "success" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/gift-cards/verify/:code", async (req, res, next) => {
  try {
    const giftCard = await getCollection("gift_cards").findOne(
      { code: req.params.code },
      { projection: { _id: 0 } },
    );

    if (!giftCard) {
      return res.json({ found: false });
    }

    if (giftCard.expiresAt && giftCard.status === "active" && Date.now() > new Date(giftCard.expiresAt).getTime()) {
      await getCollection("gift_cards").updateOne({ code: req.params.code }, { $set: { status: "expired" } });
      giftCard.status = "expired";
    }

    res.json({
      found: true,
      code: giftCard.code,
      amountEur: giftCard.amountEur,
      status: giftCard.status,
      expiresAt: giftCard.expiresAt || null,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/gift-cards/search", async (req, res, next) => {
  try {
    const query = String(req.query.query || "");
    const searchType = String(req.query.search_type || "code");

    if (searchType === "code") {
      const giftCard = await getCollection("gift_cards").findOne(
        { code: query.toUpperCase() },
        { projection: { _id: 0 } },
      );
      if (!giftCard) {
        return res.json({ found: false, results: [] });
      }
      return res.json({
        found: true,
        results: [giftCard],
      });
    }

    if (searchType === "recipient") {
      const regex = new RegExp(query, "i");
      const results = await getCollection("gift_cards")
        .find(
          {
            $or: [
              { recipient_name: regex },
              { buyer_firstname: regex },
              { buyer_lastname: regex },
            ],
          },
          { projection: { _id: 0 } },
        )
        .toArray();
      return res.json({
        found: results.length > 0,
        results,
      });
    }

    res.json({ found: false, results: [], error: "Invalid search type" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/gift-cards/:giftCardId/redeem", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const giftCard = await getCollection("gift_cards").findOne(
      { id: req.params.giftCardId },
      { projection: { _id: 0 } },
    );
    if (!giftCard) {
      return notFound(res, "Gift card not found");
    }
    if (giftCard.status !== "active") {
      return badRequest(res, `Only active cards can be redeemed. Current status: ${giftCard.status}`);
    }

    await getCollection("gift_cards").updateOne(
      { id: req.params.giftCardId },
      { $set: { status: "redeemed", redeemedAt: nowIso() } },
    );

    const updated = await getCollection("gift_cards").findOne(
      { id: req.params.giftCardId },
      { projection: { _id: 0 } },
    );

    res.json({
      success: true,
      message: "Gift card marked as redeemed",
      gift_card: updated,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/gift-cards/list", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const cards = await getCollection("gift_cards").find({}, { projection: { _id: 0 } }).toArray();
    cards.sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
    res.json(cards);
  } catch (error) {
    next(error);
  }
});

app.get("/api/gift-cards/all", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const cards = await getCollection("gift_cards").find({}, { projection: { _id: 0 } }).toArray();
    cards.sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
    res.json(cards);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/gift-cards/:giftCardId", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const validStatuses = ["pending", "active", "failed", "canceled", "expired", "redeemed"];
    if (!validStatuses.includes(req.query.status)) {
      return badRequest(res, "Invalid status");
    }
    await getCollection("gift_cards").updateOne(
      { id: req.params.giftCardId },
      { $set: { status: req.query.status } },
    );
    const giftCard = await getCollection("gift_cards").findOne(
      { id: req.params.giftCardId },
      { projection: { _id: 0 } },
    );
    res.json(giftCard);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/gift-cards/:giftCardId", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const giftCard = await getCollection("gift_cards").findOne(
      { id: req.params.giftCardId },
      { projection: { _id: 0 } },
    );
    if (!giftCard) {
      return notFound(res, "Gift card not found");
    }
    if (giftCard.status !== "pending") {
      return badRequest(res, "Only pending gift cards can be deleted");
    }
    await getCollection("gift_cards").deleteOne({ id: req.params.giftCardId });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/gift-cards/:giftCardId", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const giftCard = await getCollection("gift_cards").findOne(
      { id: req.params.giftCardId },
      { projection: { _id: 0 } },
    );
    if (!giftCard) {
      return notFound(res, "Gift card not found");
    }
    res.json(giftCard);
  } catch (error) {
    next(error);
  }
});

app.post("/api/gift-cards/:giftCardId/activate", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const giftCard = await getCollection("gift_cards").findOne(
      { id: req.params.giftCardId },
      { projection: { _id: 0 } },
    );
    if (!giftCard) {
      return notFound(res, "Gift card not found");
    }
    if (giftCard.status !== "pending") {
      return badRequest(res, "Only pending gift cards can be activated");
    }

    const expiresAt = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString();
    await getCollection("gift_cards").updateOne(
      { id: req.params.giftCardId },
      { $set: { code: generateGiftCode(), status: "active", expiresAt } },
    );

    const updated = await getCollection("gift_cards").findOne(
      { id: req.params.giftCardId },
      { projection: { _id: 0 } },
    );
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/gift-cards/:giftCardId/extend-expiry", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const newExpiryDate = normalizeIsoDate(req.body.new_expiry_date);
    if (!newExpiryDate) {
      return badRequest(res, "Invalid date format");
    }

    const result = await getCollection("gift_cards").updateOne(
      { id: req.params.giftCardId },
      { $set: { expiresAt: newExpiryDate } },
    );

    if (result.matchedCount === 0) {
      return notFound(res, "Gift card not found");
    }

    res.json({ success: true, new_expiry_date: newExpiryDate });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/gift-cards/:giftCardId/update-recipient", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const recipientName = String(req.body.recipient_name || "").trim();
    if (!recipientName) {
      return badRequest(res, "recipient_name is required");
    }

    const result = await getCollection("gift_cards").updateOne(
      { id: req.params.giftCardId },
      { $set: { recipient_name: recipientName } },
    );

    if (result.matchedCount === 0) {
      return notFound(res, "Gift card not found");
    }

    res.json({ success: true, recipient_name: recipientName });
  } catch (error) {
    next(error);
  }
});

app.post("/api/gift-cards/:giftCardId/resend-email", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const giftCard = await getCollection("gift_cards").findOne(
      { id: req.params.giftCardId },
      { projection: { _id: 0 } },
    );
    if (!giftCard) {
      return notFound(res, "Gift card not found");
    }
    if (!giftCard.code) {
      return badRequest(res, "Gift card must have a code before sending email");
    }

    const buyerName = `${giftCard.buyer_firstname} ${giftCard.buyer_lastname}`.trim();
    const success = await sendGiftCardEmail({
      toEmail: giftCard.buyer_email,
      recipientName: giftCard.recipient_name || buyerName,
      giftCardCode: giftCard.code,
      amount: giftCard.amountEur,
      expiresAt: giftCard.expiresAt,
      buyerName,
    });

    if (!success) {
      return res.status(500).json({ detail: "Failed to send email" });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/coupons", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const code = String(req.body.code || "").trim().toUpperCase();
    if (code.length < 3) {
      return badRequest(res, "Coupon code must be at least 3 characters");
    }

    if (!["percentage", "fixed"].includes(req.body.type)) {
      return badRequest(res, "Type must be 'percentage' or 'fixed'");
    }

    const value = Number(req.body.value);
    if (req.body.type === "percentage" && (value < 0 || value > 100)) {
      return badRequest(res, "Percentage must be between 0 and 100");
    }
    if (req.body.type === "fixed" && value <= 0) {
      return badRequest(res, "Fixed amount must be greater than 0");
    }

    const validTo = normalizeIsoDate(req.body.validTo);
    if (!validTo) {
      return badRequest(res, "Invalid date format for validTo");
    }

    const existing = await getCollection("coupons").findOne({ code });
    if (existing) {
      return badRequest(res, "Coupon code already exists");
    }

    const coupon = {
      id: randomId(),
      code,
      type: req.body.type,
      value,
      currency: "EUR",
      validFrom: nowIso(),
      validTo,
      isActive: req.body.isActive ?? true,
      createdAt: nowIso(),
      maxUses: req.body.maxUses ?? null,
      currentUses: 0,
    };

    await getCollection("coupons").insertOne(coupon);
    res.json(coupon);
  } catch (error) {
    next(error);
  }
});

app.get("/api/coupons", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const coupons = await getCollection("coupons").find({}, { projection: { _id: 0 } }).toArray();
    coupons.sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
    res.json(coupons);
  } catch (error) {
    next(error);
  }
});

app.get("/api/coupons/all", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const coupons = await getCollection("coupons").find({}, { projection: { _id: 0 } }).toArray();
    coupons.sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
    res.json(coupons);
  } catch (error) {
    next(error);
  }
});

app.put("/api/coupons/:couponId", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const updateData = {};
    if (req.body.code !== undefined) {
      const code = String(req.body.code).trim().toUpperCase();
      const existing = await getCollection("coupons").findOne({
        code,
        id: { $ne: req.params.couponId },
      });
      if (existing) {
        return badRequest(res, "Coupon code already exists");
      }
      updateData.code = code;
    }

    if (req.body.type !== undefined) {
      if (!["percentage", "fixed"].includes(req.body.type)) {
        return badRequest(res, "Type must be 'percentage' or 'fixed'");
      }
      updateData.type = req.body.type;
    }

    if (req.body.value !== undefined) {
      updateData.value = Number(req.body.value);
    }

    if (req.body.validTo !== undefined) {
      const validTo = normalizeIsoDate(req.body.validTo);
      if (!validTo) {
        return badRequest(res, "Invalid date format");
      }
      updateData.validTo = validTo;
    }

    if (req.body.isActive !== undefined) {
      updateData.isActive = Boolean(req.body.isActive);
    }

    if (req.body.maxUses !== undefined) {
      updateData.maxUses = req.body.maxUses;
    }

    await getCollection("coupons").updateOne({ id: req.params.couponId }, { $set: updateData });
    const updated = await getCollection("coupons").findOne(
      { id: req.params.couponId },
      { projection: { _id: 0 } },
    );

    if (!updated) {
      return notFound(res, "Coupon not found");
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/coupons/:couponId", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const result = await getCollection("coupons").deleteOne({ id: req.params.couponId });
    if (result.deletedCount === 0) {
      return notFound(res, "Coupon not found");
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/coupons/validate", async (req, res, next) => {
  try {
    const code = String(req.query.code || "").toUpperCase();
    const coupon = await getCollection("coupons").findOne({ code });

    if (!coupon) {
      return res.json({ valid: false, error: "Coupon not found", token: null });
    }
    if (!coupon.isActive) {
      return res.json({ valid: false, error: "Coupon is inactive", token: null });
    }
    if (Date.now() > new Date(coupon.validTo).getTime()) {
      return res.json({ valid: false, error: "Coupon has expired", token: null });
    }
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return res.json({ valid: false, error: "Coupon usage limit reached", token: null });
    }

    const token = crypto.randomBytes(24).toString("base64url");
    await getCollection("coupon_usages").insertOne({
      id: randomId(),
      coupon_code: coupon.code,
      session_id: null,
      gift_card_id: null,
      validation_token: token,
      status: "pending",
      created_at: nowIso(),
      applied_at: null,
    });

    res.json({
      valid: true,
      token,
      type: coupon.type,
      value: coupon.value,
      currency: coupon.currency || "EUR",
      currentUses: coupon.currentUses || 0,
      maxUses: coupon.maxUses || null,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/coupons/apply", async (req, res, next) => {
  try {
    const token = String(req.query.token || "");
    const sessionId = req.query.session_id ? String(req.query.session_id) : null;
    const usage = await getCollection("coupon_usages").findOne({ validation_token: token });
    if (!usage) {
      return res.json({ success: false, error: "Invalid or expired validation token" });
    }
    if (!["pending", "applied-pending"].includes(usage.status)) {
      return res.json({ success: false, error: "Coupon already used or canceled" });
    }

    await getCollection("coupon_usages").updateOne(
      { validation_token: token },
      {
        $set: {
          status: "applied",
          session_id: sessionId,
          applied_at: nowIso(),
        },
      },
    );

    await getCollection("coupons").updateOne({ code: usage.coupon_code }, { $inc: { currentUses: 1 } });

    res.json({
      success: true,
      message: "Coupon applied successfully",
      coupon_code: usage.coupon_code,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/coupons/cancel/:token", async (req, res, next) => {
  try {
    const usage = await getCollection("coupon_usages").findOne({
      validation_token: req.params.token,
    });
    if (!usage) {
      return res.json({ success: false, error: "Usage record not found" });
    }
    if (usage.status !== "pending") {
      return res.json({ success: false, error: "Can only cancel pending coupons" });
    }
    await getCollection("coupon_usages").updateOne(
      { validation_token: req.params.token },
      { $set: { status: "canceled" } },
    );
    res.json({ success: true, message: "Coupon usage canceled" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/testimonials", async (req, res, next) => {
  try {
    const payload = {
      id: randomId(),
      name: String(req.body.name || "").trim(),
      rating: Number(req.body.rating),
      text: String(req.body.text || "").trim(),
      service: req.body.service ? String(req.body.service).trim() : null,
      allowDisplay: Boolean(req.body.allowDisplay),
      isApproved: Boolean(req.body.allowDisplay),
      createdAt: nowIso(),
    };

    if (payload.name.length < 2 || payload.name.length > 60) {
      return badRequest(res, "Invalid name");
    }
    if (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5) {
      return badRequest(res, "Invalid rating");
    }
    if (payload.text.length < 10 || payload.text.length > 600) {
      return badRequest(res, "Invalid text");
    }

    await getCollection("testimonials").insertOne(payload);
    res.json({ success: true, id: payload.id });
  } catch (error) {
    next(error);
  }
});

app.get("/api/testimonials", async (req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit || 6), 12));
    const items = await getCollection("testimonials")
      .find({ isApproved: true }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    res.json({ items });
  } catch (error) {
    next(error);
  }
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

app.get("/api/business-hours", async (req, res, next) => {
  try {
    const general = await getCollection("business_hours_general").findOne({ _id: "main" });
    if (!general) {
      return res.json(defaultBusinessHours);
    }
    const result = { ...general };
    delete result._id;
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/business-hours", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    await getCollection("business_hours_general").updateOne(
      { _id: "main" },
      { $set: { _id: "main", ...req.body } },
      { upsert: true },
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/business-hours/exceptions", async (req, res, next) => {
  try {
    const items = await getCollection("business_hours_exceptions")
      .find({}, { projection: { _id: 0 } })
      .sort({ date: 1 })
      .toArray();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

app.post("/api/business-hours/exceptions", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    if (!req.body.date) {
      return badRequest(res, "date field required");
    }

    const doc = {
      date: req.body.date,
      endDate: req.body.endDate || null,
      isOpen: req.body.isOpen ?? true,
      startTime: req.body.startTime || null,
      endTime: req.body.endTime || null,
      reason: req.body.reason || "",
    };

    await getCollection("business_hours_exceptions").updateOne(
      { date: doc.date },
      { $set: doc },
      { upsert: true },
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/business-hours/exceptions/:date", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const result = await getCollection("business_hours_exceptions").deleteOne({ date: req.params.date });
    if (result.deletedCount === 0) {
      return notFound(res, "Exception not found");
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/business-hours/holidays", async (req, res, next) => {
  try {
    const items = await getCollection("business_hours_holidays")
      .find({}, { projection: { _id: 0 } })
      .sort({ date: 1 })
      .toArray();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

app.post("/api/business-hours/holidays", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    if (!req.body.date || !req.body.name) {
      return badRequest(res, "date and name fields required");
    }

    await getCollection("business_hours_holidays").updateOne(
      { date: req.body.date },
      {
        $set: {
          date: req.body.date,
          name: req.body.name,
          isClosed: req.body.isClosed ?? true,
        },
      },
      { upsert: true },
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/business-hours/holidays/:date", async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const result = await getCollection("business_hours_holidays").deleteOne({ date: req.params.date });
    if (result.deletedCount === 0) {
      return notFound(res, "Holiday not found");
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/business-hours/status", async (req, res, next) => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const dayKey = String((now.getDay() + 0) % 7);

    const holiday = await getCollection("business_hours_holidays").findOne({ date: todayStr });
    if (holiday?.isClosed) {
      return res.json({
        status: "closed",
        message: `Fermé - ${holiday.name}`,
        hours: null,
      });
    }

    const exception = await getCollection("business_hours_exceptions").findOne({ date: todayStr });
    if (exception) {
      if (!exception.isOpen) {
        return res.json({
          status: "closed",
          message: `Fermé - ${exception.reason || "Exception"}`,
          hours: null,
        });
      }

      const hours = {
        open: exception.startTime,
        close: exception.endTime,
      };

      return res.json({
        status: isCurrentlyOpen(hours) ? "open" : "closed",
        message: `Horaires modifiés - ${exception.reason || "Exception"}`,
        hours,
      });
    }

    const general = await getCollection("business_hours_general").findOne({ _id: "main" });
    const dayHours = (general || defaultBusinessHours)[dayKey];

    if (!dayHours?.open || !dayHours?.close) {
      return res.json({
        status: "closed",
        message: "Fermé aujourd'hui",
        hours: null,
      });
    }

    res.json({
      status: isCurrentlyOpen(dayHours) ? "open" : "closed",
      message: isCurrentlyOpen(dayHours) ? "Ouvert" : "Fermé",
      hours: dayHours,
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ detail: error.message || "Internal server error" });
});

async function start() {
  if (!mongoUrl || !dbName) {
    throw new Error("MONGO_URL et DB_NAME sont requis");
  }

  mongoClient = new MongoClient(mongoUrl);
  await mongoClient.connect();
  db = mongoClient.db(dbName);
  await seedDatabase();

  app.listen(port, () => {
    console.info(`API Node démarrée sur le port ${port}`);
  });
}

async function shutdown() {
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
