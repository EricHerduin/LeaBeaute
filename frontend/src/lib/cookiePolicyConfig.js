import api from "./apiClient";

export const DEFAULT_COOKIE_POLICY_CONFIG = {
  policyVersion: "2026-03-28",
  bannerVersion: "2026-03-28",
  lastUpdated: "2026-03-28",
  choiceRetentionDays: 180,
  evidenceRetentionDays: 1095,
  necessaryRetentionLabel: "la durée de la session ou la durée strictement nécessaire au service demandé",
  stripeRetentionLabel: "la durée définie par Stripe pour ses traceurs techniques et de sécurité",
  analyticsProvider: "google-analytics-4",
  analyticsMeasurementId: "",
  analyticsEnabled: false,
};

let cachedCookiePolicyConfig = DEFAULT_COOKIE_POLICY_CONFIG;

function normalizePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

function normalizeConfig(payload = {}) {
  return {
    policyVersion: String(payload.policyVersion || DEFAULT_COOKIE_POLICY_CONFIG.policyVersion),
    bannerVersion: String(payload.bannerVersion || DEFAULT_COOKIE_POLICY_CONFIG.bannerVersion),
    lastUpdated: String(payload.lastUpdated || DEFAULT_COOKIE_POLICY_CONFIG.lastUpdated),
    choiceRetentionDays: normalizePositiveInteger(
      payload.choiceRetentionDays,
      DEFAULT_COOKIE_POLICY_CONFIG.choiceRetentionDays,
    ),
    evidenceRetentionDays: normalizePositiveInteger(
      payload.evidenceRetentionDays,
      DEFAULT_COOKIE_POLICY_CONFIG.evidenceRetentionDays,
    ),
    necessaryRetentionLabel:
      String(payload.necessaryRetentionLabel || "").trim()
      || DEFAULT_COOKIE_POLICY_CONFIG.necessaryRetentionLabel,
    stripeRetentionLabel:
      String(payload.stripeRetentionLabel || "").trim()
      || DEFAULT_COOKIE_POLICY_CONFIG.stripeRetentionLabel,
    analyticsProvider:
      String(payload.analyticsProvider || DEFAULT_COOKIE_POLICY_CONFIG.analyticsProvider).trim()
      || DEFAULT_COOKIE_POLICY_CONFIG.analyticsProvider,
    analyticsMeasurementId: String(payload.analyticsMeasurementId || "").trim(),
    analyticsEnabled:
      Boolean(payload.analyticsEnabled)
      && Boolean(String(payload.analyticsMeasurementId || "").trim()),
  };
}

export function getCookiePolicyConfig() {
  return cachedCookiePolicyConfig;
}

export async function fetchCookiePolicyConfig() {
  try {
    const response = await api.get("/cookie-policy-config");
    cachedCookiePolicyConfig = normalizeConfig(response.data);
  } catch {
    cachedCookiePolicyConfig = normalizeConfig(cachedCookiePolicyConfig);
  }

  return cachedCookiePolicyConfig;
}

export function getCookieConsentValidityMs(config = cachedCookiePolicyConfig) {
  return normalizePositiveInteger(
    config?.choiceRetentionDays,
    DEFAULT_COOKIE_POLICY_CONFIG.choiceRetentionDays,
  ) * 24 * 60 * 60 * 1000;
}

export function formatRetentionDuration(days) {
  const safeDays = normalizePositiveInteger(days, DEFAULT_COOKIE_POLICY_CONFIG.choiceRetentionDays);

  if (safeDays % 365 === 0) {
    const years = safeDays / 365;
    return `${years} ${years > 1 ? "ans" : "an"}`;
  }

  if (safeDays % 30 === 0) {
    const months = safeDays / 30;
    return `${months} mois`;
  }

  return `${safeDays} jours`;
}

export function formatCookiePolicyDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
