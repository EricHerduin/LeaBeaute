function createCookieConsentService(deps) {
  const {
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
  } = deps;

  return {
    async getPolicyConfig() {
      return getCookiePolicyConfig();
    },

    async updatePolicyConfig(body) {
      const normalizedConfig = normalizeCookiePolicyConfig({
        ...defaultCookiePolicyConfig,
        ...body,
        lastUpdated: body.lastUpdated || new Date().toISOString().slice(0, 10),
      });

      setAdminSetting("cookie_policy_config", normalizedConfig);
      return getCookiePolicyConfig();
    },

    getConsentByVisitorId(visitorId) {
      return getConsentByVisitorId(visitorId);
    },

    listConsents({ search, limit }) {
      const safeSearch = escapeLike(search);
      const where = safeSearch
        ? `WHERE anonymous_visitor_id LIKE ${sqlValue(`%${safeSearch}%`)} ESCAPE '\\'
            OR decision LIKE ${sqlValue(`%${safeSearch}%`)} ESCAPE '\\'
            OR source LIKE ${sqlValue(`%${safeSearch}%`)} ESCAPE '\\'
            OR policy_version LIKE ${sqlValue(`%${safeSearch}%`)} ESCAPE '\\'
            OR user_agent LIKE ${sqlValue(`%${safeSearch}%`)} ESCAPE '\\'`
        : "";

      const items = readRows(`
        SELECT
          c.anonymous_visitor_id,
          c.categories_json,
          c.decision,
          c.source,
          c.policy_version,
          c.updated_at,
          COUNT(h.id) AS history_count
        FROM cookie_consents c
        LEFT JOIN cookie_consent_history h ON h.anonymous_visitor_id = c.anonymous_visitor_id
        ${where}
        GROUP BY c.anonymous_visitor_id, c.categories_json, c.decision, c.source, c.policy_version, c.updated_at
        ORDER BY c.updated_at DESC
        LIMIT ${limit};
      `).map((row) => ({
        anonymousVisitorId: row.anonymous_visitor_id,
        categories: parseJson(row.categories_json, {}),
        decision: row.decision,
        source: row.source,
        policyVersion: row.policy_version,
        updatedAt: row.updated_at,
        historyCount: Number(row.history_count || 0),
      }));

      return { items, count: items.length };
    },

    async saveConsent({ body, headers, ip }) {
      const anonymousVisitorId = String(body.anonymousVisitorId || "").trim();
      if (!anonymousVisitorId) {
        const error = new Error("anonymousVisitorId is required");
        error.status = 400;
        throw error;
      }

      const categories = normalizeConsentCategories(body.categories || {});
      const source = String(body.source || "banner");
      const cookiePolicyConfig = await getCookiePolicyConfig();
      const policyVersion = String(body.policyVersion || cookiePolicyConfig.policyVersion);
      const bannerVersion = String(body.bannerVersion || cookiePolicyConfig.bannerVersion);
      const locale = String(body.locale || "fr-FR");
      const decision =
        categories.preferences || categories.analytics || categories.marketing
          ? "custom-or-accepted"
          : "necessary-only";

      const now = nowIso();
      const forwardedIp = headers["x-forwarded-for"];
      const rawIp = Array.isArray(forwardedIp) ? forwardedIp[0] : (forwardedIp || ip || "");
      const ipHash = rawIp ? sha256(rawIp).slice(0, 32) : null;
      const userAgent = String(headers["user-agent"] || "").slice(0, 255);

      runSql(`
        INSERT INTO cookie_consents (
          anonymous_visitor_id, decision, source, policy_version, banner_version, locale, categories_json,
          ip_hash, user_agent, choice_expires_at, evidence_expires_at, created_at, updated_at
        ) VALUES (
          ${sqlValue(anonymousVisitorId)},
          ${sqlValue(decision)},
          ${sqlValue(source)},
          ${sqlValue(policyVersion)},
          ${sqlValue(bannerVersion)},
          ${sqlValue(locale)},
          ${sqlJson(categories)},
          ${sqlValue(ipHash)},
          ${sqlValue(userAgent)},
          ${sqlValue(addDaysToIso(cookiePolicyConfig.choiceRetentionDays))},
          ${sqlValue(addDaysToIso(cookiePolicyConfig.evidenceRetentionDays))},
          ${sqlValue(now)},
          ${sqlValue(now)}
        )
        ON CONFLICT(anonymous_visitor_id) DO UPDATE SET
          decision = excluded.decision,
          source = excluded.source,
          policy_version = excluded.policy_version,
          banner_version = excluded.banner_version,
          locale = excluded.locale,
          categories_json = excluded.categories_json,
          ip_hash = excluded.ip_hash,
          user_agent = excluded.user_agent,
          choice_expires_at = excluded.choice_expires_at,
          evidence_expires_at = excluded.evidence_expires_at,
          updated_at = excluded.updated_at;
      `);

      runSql(`
        INSERT INTO cookie_consent_history (
          id, anonymous_visitor_id, decision, source, policy_version, banner_version, locale,
          categories_json, ip_hash, user_agent, saved_at
        ) VALUES (
          ${sqlValue(randomId())},
          ${sqlValue(anonymousVisitorId)},
          ${sqlValue(decision)},
          ${sqlValue(source)},
          ${sqlValue(policyVersion)},
          ${sqlValue(bannerVersion)},
          ${sqlValue(locale)},
          ${sqlJson(categories)},
          ${sqlValue(ipHash)},
          ${sqlValue(userAgent)},
          ${sqlValue(now)}
        );
      `);

      return getConsentByVisitorId(anonymousVisitorId);
    },
  };
}

module.exports = {
  createCookieConsentService,
};
