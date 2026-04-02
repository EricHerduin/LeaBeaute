function createCookieConsentController({ cookieConsentService }) {
  return {
    async getPolicyConfig(req, res, next) {
      try {
        res.json(await cookieConsentService.getPolicyConfig());
      } catch (error) {
        next(error);
      }
    },

    async updatePolicyConfig(req, res, next) {
      try {
        res.json(await cookieConsentService.updatePolicyConfig(req.body));
      } catch (error) {
        next(error);
      }
    },

    getConsentByVisitorId(req, res, next) {
      try {
        const consent = cookieConsentService.getConsentByVisitorId(req.params.visitorId);
        if (!consent) {
          res.status(404).json({ detail: "Consent record not found" });
          return;
        }
        res.json(consent);
      } catch (error) {
        next(error);
      }
    },

    listConsents(req, res, next) {
      try {
        const search = String(req.query.search || "").trim();
        const limit = Math.max(1, Math.min(Number(req.query.limit || 200), 1000));
        res.json(cookieConsentService.listConsents({ search, limit }));
      } catch (error) {
        next(error);
      }
    },

    async saveConsent(req, res, next) {
      try {
        res.json(await cookieConsentService.saveConsent({
          body: req.body,
          headers: req.headers,
          ip: req.ip,
        }));
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createCookieConsentController,
};
