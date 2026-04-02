const express = require("express");

function createCookieConsentRoutes({ cookieConsentController, requireAdmin }) {
  const router = express.Router();

  router.get("/cookie-policy-config", cookieConsentController.getPolicyConfig);
  router.put("/admin/cookie-policy-config", requireAdmin, cookieConsentController.updatePolicyConfig);
  router.get("/cookie-consent/:visitorId", cookieConsentController.getConsentByVisitorId);
  router.get("/cookie-consents", requireAdmin, cookieConsentController.listConsents);
  router.post("/cookie-consent", cookieConsentController.saveConsent);

  return router;
}

module.exports = {
  createCookieConsentRoutes,
};
