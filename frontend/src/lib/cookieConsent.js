import api from "./apiClient";
import {
  getCookieConsentValidityMs,
  getCookiePolicyConfig,
} from "./cookiePolicyConfig";

export const COOKIE_CONSENT_STORAGE_KEY = "cookieConsentState";
export const COOKIE_VISITOR_ID_STORAGE_KEY = "anonymousVisitorId";
export const COOKIE_CONSENT_OPEN_EVENT = "lea-cookie-consent-open";
export const COOKIE_CONSENT_UPDATED_EVENT = "lea-cookie-consent-updated";

export const DEFAULT_COOKIE_CATEGORIES = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
};

function createFallbackVisitorId() {
  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnonymousVisitorId() {
  const existingId = localStorage.getItem(COOKIE_VISITOR_ID_STORAGE_KEY);
  if (existingId) {
    return existingId;
  }

  const visitorId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : createFallbackVisitorId();

  localStorage.setItem(COOKIE_VISITOR_ID_STORAGE_KEY, visitorId);
  return visitorId;
}

export function readStoredCookieConsent() {
  try {
    const rawValue = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue?.updatedAt) {
      return null;
    }

    return {
      ...parsedValue,
      categories: {
        ...DEFAULT_COOKIE_CATEGORIES,
        ...(parsedValue.categories || {}),
        necessary: true,
      },
    };
  } catch {
    return null;
  }
}

export function saveCookieConsentLocally(consent) {
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, { detail: consent }));
}

export function isCookieConsentExpired(consent) {
  if (!consent?.updatedAt) {
    return true;
  }

  const updatedAt = new Date(consent.updatedAt).getTime();
  return Number.isNaN(updatedAt) || Date.now() - updatedAt > getCookieConsentValidityMs();
}

export function buildCookieConsentPayload(categories, source = "banner") {
  const now = new Date().toISOString();
  const policyConfig = getCookiePolicyConfig();

  return {
    anonymousVisitorId: getAnonymousVisitorId(),
    categories: {
      ...DEFAULT_COOKIE_CATEGORIES,
      ...categories,
      necessary: true,
    },
    source,
    policyVersion: policyConfig.policyVersion,
    bannerVersion: policyConfig.bannerVersion,
    locale: "fr-FR",
    updatedAt: now,
  };
}

export async function syncCookieConsentWithBackend(consent) {
  const response = await api.post("/cookie-consent", consent);
  return response.data;
}

export async function fetchCookieConsentFromBackend(visitorId) {
  const response = await api.get(`/cookie-consent/${visitorId}`);
  return response.data;
}

export function openCookieConsentManager() {
  window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT));
}
