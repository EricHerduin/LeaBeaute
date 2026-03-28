import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  readStoredCookieConsent,
} from "@/lib/cookieConsent";
import {
  fetchCookiePolicyConfig,
  getCookiePolicyConfig,
} from "@/lib/cookiePolicyConfig";

const GA_SCRIPT_ID = "lea-ga-script";

function isAnalyticsAllowed() {
  const consent = readStoredCookieConsent();
  return Boolean(consent?.categories?.analytics);
}

function ensureDataLayer() {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag
    || function gtag() {
      window.dataLayer.push(arguments);
    };
}

function removeGoogleAnalytics() {
  const script = document.getElementById(GA_SCRIPT_ID);
  if (script) {
    script.remove();
  }

  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }
}

function loadGoogleAnalytics(measurementId) {
  if (!measurementId) {
    return;
  }

  ensureDataLayer();

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }

  window.gtag("js", new Date());
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("config", measurementId, {
    anonymize_ip: true,
    send_page_view: false,
  });
}

export default function GoogleAnalyticsConsentBridge() {
  const location = useLocation();
  const [policyConfig, setPolicyConfig] = useState(getCookiePolicyConfig());
  const lastTrackedPath = useRef("");

  useEffect(() => {
    let isMounted = true;

    fetchCookiePolicyConfig().then((config) => {
      if (isMounted) {
        setPolicyConfig(config);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const syncAnalyticsScript = () => {
      if (policyConfig.analyticsEnabled && isAnalyticsAllowed()) {
        loadGoogleAnalytics(policyConfig.analyticsMeasurementId);
        return;
      }

      removeGoogleAnalytics();
    };

    syncAnalyticsScript();
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, syncAnalyticsScript);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, syncAnalyticsScript);
    };
  }, [policyConfig]);

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;
    if (lastTrackedPath.current === path) {
      return;
    }

    lastTrackedPath.current = path;

    if (
      !policyConfig.analyticsEnabled
      || !policyConfig.analyticsMeasurementId
      || !isAnalyticsAllowed()
      || typeof window.gtag !== "function"
    ) {
      return;
    }

    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: `${location.pathname}${location.search}`,
    });
  }, [location, policyConfig]);

  return null;
}
