const crypto = require("crypto");

function createCouponsService(deps) {
  const {
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
  } = deps;

  return {
    createCoupon(body) {
      const code = String(body.code || "").trim().toUpperCase();
      if (code.length < 3) {
        const error = new Error("Coupon code must be at least 3 characters");
        error.status = 400;
        throw error;
      }

      if (!["percentage", "fixed"].includes(body.type)) {
        const error = new Error("Type must be 'percentage' or 'fixed'");
        error.status = 400;
        throw error;
      }

      const value = Number(body.value);
      if (body.type === "percentage" && (value < 0 || value > 100)) {
        const error = new Error("Percentage must be between 0 and 100");
        error.status = 400;
        throw error;
      }
      if (body.type === "fixed" && value <= 0) {
        const error = new Error("Fixed amount must be greater than 0");
        error.status = 400;
        throw error;
      }

      const validTo = normalizeIsoDate(body.validTo);
      if (!validTo) {
        const error = new Error("Invalid date format for validTo");
        error.status = 400;
        throw error;
      }

      const existing = getCouponByCode(code);
      if (existing) {
        const error = new Error("Coupon code already exists");
        error.status = 400;
        throw error;
      }

      const coupon = {
        id: randomId(),
        code,
        type: body.type,
        value,
        currency: "EUR",
        validFrom: nowIso(),
        validTo,
        isActive: body.isActive ?? true,
        createdAt: nowIso(),
        maxUses: body.maxUses ?? null,
        currentUses: 0,
      };

      runSql(`
        INSERT INTO coupons (
          id, code, type, value, currency, valid_from, valid_to, is_active, created_at, max_uses, current_uses, updated_at
        ) VALUES (
          ${sqlValue(coupon.id)},
          ${sqlValue(coupon.code)},
          ${sqlValue(coupon.type)},
          ${sqlValue(coupon.value)},
          'EUR',
          ${sqlValue(coupon.validFrom)},
          ${sqlValue(coupon.validTo)},
          ${sqlBool(coupon.isActive)},
          ${sqlValue(coupon.createdAt)},
          ${sqlValue(coupon.maxUses)},
          0,
          ${sqlValue(coupon.createdAt)}
        );
      `);

      return coupon;
    },

    listCoupons() {
      return readRows("SELECT * FROM coupons ORDER BY created_at DESC;").map(mapCouponRow);
    },

    updateCoupon(couponId, body) {
      const existingRow = readOne(`SELECT * FROM coupons WHERE id = ${sqlValue(couponId)} LIMIT 1;`);
      if (!existingRow) {
        return null;
      }

      const updateData = {};
      if (body.code !== undefined) {
        const code = String(body.code).trim().toUpperCase();
        const duplicate = readOne(`
          SELECT id FROM coupons
          WHERE code = ${sqlValue(code)}
            AND id != ${sqlValue(couponId)}
          LIMIT 1;
        `);
        if (duplicate) {
          const error = new Error("Coupon code already exists");
          error.status = 400;
          throw error;
        }
        updateData.code = code;
      }

      if (body.type !== undefined) {
        if (!["percentage", "fixed"].includes(body.type)) {
          const error = new Error("Type must be 'percentage' or 'fixed'");
          error.status = 400;
          throw error;
        }
        updateData.type = body.type;
      }

      if (body.value !== undefined) {
        updateData.value = Number(body.value);
      }

      if (body.validTo !== undefined) {
        const validTo = normalizeIsoDate(body.validTo);
        if (!validTo) {
          const error = new Error("Invalid date format");
          error.status = 400;
          throw error;
        }
        updateData.valid_to = validTo;
      }

      if (body.isActive !== undefined) {
        updateData.is_active = body.isActive ? 1 : 0;
      }

      if (body.maxUses !== undefined) {
        updateData.max_uses = body.maxUses;
      }

      const setters = Object.entries(updateData)
        .map(([key, value]) => `${key} = ${sqlValue(value)}`)
        .join(", ");

      if (setters) {
        runSql(`
          UPDATE coupons
          SET ${setters}, updated_at = ${sqlValue(nowIso())}
          WHERE id = ${sqlValue(couponId)};
        `);
      }

      return mapCouponRow(readOne(`SELECT * FROM coupons WHERE id = ${sqlValue(couponId)} LIMIT 1;`));
    },

    deleteCoupon(couponId) {
      const existing = readOne(`SELECT id FROM coupons WHERE id = ${sqlValue(couponId)} LIMIT 1;`);
      if (!existing) {
        return false;
      }
      runSql(`DELETE FROM coupons WHERE id = ${sqlValue(couponId)};`);
      return true;
    },

    validateCoupon(codeInput) {
      const code = String(codeInput || "").toUpperCase();
      const coupon = getCouponByCode(code);

      if (!coupon) {
        return { valid: false, error: "Coupon not found", token: null };
      }
      if (!coupon.isActive) {
        return { valid: false, error: "Coupon is inactive", token: null };
      }
      if (Date.now() > new Date(coupon.validTo).getTime()) {
        return { valid: false, error: "Coupon has expired", token: null };
      }
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        return { valid: false, error: "Coupon usage limit reached", token: null };
      }

      const token = crypto.randomBytes(24).toString("base64url");
      runSql(`
        INSERT INTO coupon_usages (
          id, coupon_code, session_id, gift_card_id, validation_token, status, created_at, applied_at, updated_at
        ) VALUES (
          ${sqlValue(randomId())},
          ${sqlValue(coupon.code)},
          NULL,
          NULL,
          ${sqlValue(token)},
          'pending',
          ${sqlValue(nowIso())},
          NULL,
          ${sqlValue(nowIso())}
        );
      `);

      return {
        valid: true,
        token,
        type: coupon.type,
        value: coupon.value,
        currency: coupon.currency || "EUR",
        currentUses: coupon.currentUses || 0,
        maxUses: coupon.maxUses || null,
      };
    },

    applyCoupon(tokenInput, sessionIdInput) {
      const token = String(tokenInput || "");
      const sessionId = sessionIdInput ? String(sessionIdInput) : null;
      const usage = getCouponUsageByToken(token);
      if (!usage) {
        return { success: false, error: "Invalid or expired validation token" };
      }
      if (!["pending", "applied-pending"].includes(usage.status)) {
        return { success: false, error: "Coupon already used or canceled" };
      }

      runSql(`
        UPDATE coupon_usages
        SET
          status = 'applied',
          session_id = ${sqlValue(sessionId)},
          applied_at = ${sqlValue(nowIso())},
          updated_at = ${sqlValue(nowIso())}
        WHERE validation_token = ${sqlValue(token)};
      `);

      runSql(`
        UPDATE coupons
        SET current_uses = current_uses + 1, updated_at = ${sqlValue(nowIso())}
        WHERE code = ${sqlValue(usage.coupon_code)};
      `);

      return {
        success: true,
        message: "Coupon applied successfully",
        coupon_code: usage.coupon_code,
      };
    },

    cancelCoupon(token) {
      const usage = getCouponUsageByToken(token);
      if (!usage) {
        return { success: false, error: "Usage record not found" };
      }
      if (usage.status !== "pending") {
        return { success: false, error: "Can only cancel pending coupons" };
      }

      runSql(`
        UPDATE coupon_usages
        SET status = 'canceled', updated_at = ${sqlValue(nowIso())}
        WHERE validation_token = ${sqlValue(token)};
      `);

      return { success: true, message: "Coupon usage canceled" };
    },
  };
}

module.exports = {
  createCouponsService,
};
