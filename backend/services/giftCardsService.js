function createGiftCardsService(deps) {
  const {
    stripe,
    stripeWebhookSecret,
    badRequest,
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
  } = deps;

  return {
    ensureStripeConfigured() {
      if (!stripe) {
        const error = new Error("Stripe API key not configured.");
        error.status = 501;
        throw error;
      }
    },

    async createCheckout(body) {
      this.ensureStripeConfigured();

      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount < 10 || amount > 500) {
        const error = new Error("Invalid gift card amount");
        error.status = 400;
        throw error;
      }

      let finalAmount = amount;
      let couponData = null;
      let couponToken = null;

      if (body.coupon_token) {
        const couponUsage = getCouponUsageByToken(body.coupon_token);
        if (!couponUsage) {
          const error = new Error("Invalid coupon token");
          error.status = 400;
          throw error;
        }
        if (couponUsage.status !== "pending") {
          const error = new Error("Coupon already used or invalid");
          error.status = 400;
          throw error;
        }

        const coupon = getCouponByCode(couponUsage.coupon_code);
        if (!coupon) {
          const error = new Error("Coupon not found");
          error.status = 400;
          throw error;
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
        couponToken = body.coupon_token;

        runSql(`
          UPDATE coupon_usages
          SET status = 'applied-pending', updated_at = CURRENT_TIMESTAMP
          WHERE validation_token = ${sqlValue(couponToken)};
        `);
      }

      const giftCardId = randomId();
      runSql(`
        INSERT INTO gift_cards (
          id, code, amount_eur, original_amount, status, created_at, expires_at, stripe_session_id, stripe_payment_intent_id,
          buyer_firstname, buyer_lastname, buyer_email, buyer_phone, recipient_name, personal_message, coupon_token, updated_at
        ) VALUES (
          ${sqlValue(giftCardId)},
          NULL,
          ${sqlValue(finalAmount)},
          ${sqlValue(amount)},
          'pending',
          ${sqlValue(nowIso())},
          NULL,
          NULL,
          NULL,
          ${sqlValue(body.buyer_firstname)},
          ${sqlValue(body.buyer_lastname)},
          ${sqlValue(body.buyer_email)},
          ${sqlValue(body.buyer_phone)},
          ${sqlValue(body.recipient_name || null)},
          ${sqlValue(body.personal_message || null)},
          ${sqlValue(couponToken)},
          ${sqlValue(nowIso())}
        );
      `);

      try {
        const successUrl = `${body.origin_url}/gift-card-success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${body.origin_url}/#cartes-cadeaux`;

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

        runSql(`
          UPDATE gift_cards
          SET stripe_session_id = ${sqlValue(session.id)}, updated_at = ${sqlValue(nowIso())}
          WHERE id = ${sqlValue(giftCardId)};
        `);

        runSql(`
          INSERT INTO payment_transactions (
            id, gift_card_id, session_id, amount, original_amount, currency, status, payment_status,
            coupon_token, coupon_data_json, metadata_json, created_at, updated_at
          ) VALUES (
            ${sqlValue(randomId())},
            ${sqlValue(giftCardId)},
            ${sqlValue(session.id)},
            ${sqlValue(finalAmount)},
            ${sqlValue(amount)},
            'eur',
            'pending',
            'pending',
            ${sqlValue(couponToken)},
            ${sqlJson(couponData, null)},
            ${sqlJson({ gift_card_id: giftCardId }, null)},
            ${sqlValue(nowIso())},
            ${sqlValue(nowIso())}
          );
        `);

        return { url: session.url, session_id: session.id };
      } catch (error) {
        runSql(`DELETE FROM gift_cards WHERE id = ${sqlValue(giftCardId)};`);
        if (couponToken) {
          runSql(`
            UPDATE coupon_usages
            SET status = 'pending', updated_at = CURRENT_TIMESTAMP
            WHERE validation_token = ${sqlValue(couponToken)};
          `);
        }

        if (error?.type?.startsWith("Stripe")) {
          const stripeError = new Error(`Stripe error: ${error.message}`);
          stripeError.status = 400;
          throw stripeError;
        }

        throw error;
      }
    },

    async getCheckoutStatus(sessionId) {
      this.ensureStripeConfigured();

      const transaction = getPaymentTransactionBySessionId(sessionId);
      if (!transaction) {
        return null;
      }

      if (transaction.payment_status === "paid") {
        return {
          payment_status: "paid",
          status: "complete",
          gift_card: getGiftCardById(transaction.gift_card_id),
        };
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const paymentStatus = session.payment_status === "paid" ? "paid" : session.payment_status || "pending";

      runSql(`
        UPDATE payment_transactions
        SET
          payment_status = ${sqlValue(paymentStatus)},
          status = ${sqlValue(session.status)},
          updated_at = ${sqlValue(nowIso())}
        WHERE session_id = ${sqlValue(sessionId)};
      `);

      if (paymentStatus === "paid") {
        const giftCard = await activateGiftCardAfterPayment({
          giftCardId: transaction.gift_card_id,
          sessionId,
          couponToken: transaction.coupon_token,
        });

        return {
          payment_status: "paid",
          status: "complete",
          gift_card: giftCard,
        };
      }

      return {
        payment_status: paymentStatus,
        status: session.status,
        gift_card: null,
      };
    },

    handleStripeWebhook(rawBody, signature) {
      if (!stripe || !stripeWebhookSecret) {
        const error = new Error("Invalid signature");
        error.status = 400;
        throw error;
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
      } catch {
        const error = new Error("Invalid signature");
        error.status = 400;
        throw error;
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        runSql(`
          UPDATE payment_transactions
          SET payment_status = 'paid', status = 'complete', updated_at = ${sqlValue(nowIso())}
          WHERE session_id = ${sqlValue(session.id)};
        `);
      }

      return { status: "success" };
    },

    verifyGiftCard(code) {
      const giftCard = getGiftCardByCode(code);
      if (!giftCard) {
        return { found: false };
      }

      if (giftCard.expiresAt && giftCard.status === "active" && Date.now() > new Date(giftCard.expiresAt).getTime()) {
        runSql(`
          UPDATE gift_cards
          SET status = 'expired', updated_at = ${sqlValue(nowIso())}
          WHERE code = ${sqlValue(code)};
        `);
        giftCard.status = "expired";
      }

      return {
        found: true,
        code: giftCard.code,
        amountEur: giftCard.amountEur,
        status: giftCard.status,
        expiresAt: giftCard.expiresAt || null,
      };
    },

    searchGiftCards(query, searchType) {
      const rawQuery = String(query || "").trim();
      if (!rawQuery) {
        return { found: false, results: [] };
      }

      if (searchType === "code") {
        const queryUpper = rawQuery.toUpperCase();
        const normalizedCode = queryUpper.replace(/[^A-Z0-9]/g, "");
        const safeLike = `%${escapeLike(queryUpper)}%`;

        const results = readRows(`
          SELECT * FROM gift_cards
          WHERE
            UPPER(code) = ${sqlValue(queryUpper)}
            OR REPLACE(UPPER(code), '-', '') = ${sqlValue(normalizedCode)}
            OR UPPER(code) LIKE ${sqlValue(safeLike)}
          ORDER BY created_at DESC
          LIMIT 20;
        `).map(mapGiftCardRow);

        return { found: results.length > 0, results };
      }

      if (searchType === "recipient") {
        const safeQuery = `%${escapeLike(rawQuery)}%`;
        const results = readRows(`
          SELECT * FROM gift_cards
          WHERE UPPER(COALESCE(recipient_name, '')) LIKE UPPER(${sqlValue(safeQuery)})
             OR UPPER(COALESCE(buyer_firstname, '')) LIKE UPPER(${sqlValue(safeQuery)})
             OR UPPER(COALESCE(buyer_lastname, '')) LIKE UPPER(${sqlValue(safeQuery)})
             OR UPPER(COALESCE(buyer_email, '')) LIKE UPPER(${sqlValue(safeQuery)})
             OR UPPER(COALESCE(code, '')) LIKE UPPER(${sqlValue(safeQuery)})
          ORDER BY created_at DESC;
        `).map(mapGiftCardRow);

        return {
          found: results.length > 0,
          results,
        };
      }

      return { found: false, results: [], error: "Invalid search type" };
    },

    redeemGiftCard(giftCardId) {
      const giftCard = getGiftCardById(giftCardId);
      if (!giftCard) {
        return null;
      }
      if (giftCard.status !== "active") {
        const error = new Error(`Only active cards can be redeemed. Current status: ${giftCard.status}`);
        error.status = 400;
        throw error;
      }

      runSql(`
        UPDATE gift_cards
        SET status = 'redeemed', redeemed_at = ${sqlValue(nowIso())}, updated_at = ${sqlValue(nowIso())}
        WHERE id = ${sqlValue(giftCardId)};
      `);

      return {
        success: true,
        message: "Gift card marked as redeemed",
        gift_card: getGiftCardById(giftCardId),
      };
    },

    listGiftCards() {
      return readRows("SELECT * FROM gift_cards ORDER BY created_at DESC;").map(mapGiftCardRow);
    },

    updateGiftCardStatus(giftCardId, status) {
      const validStatuses = ["pending", "active", "failed", "canceled", "expired", "redeemed"];
      if (!validStatuses.includes(status)) {
        const error = new Error("Invalid status");
        error.status = 400;
        throw error;
      }

      runSql(`
        UPDATE gift_cards
        SET status = ${sqlValue(status)}, updated_at = ${sqlValue(nowIso())}
        WHERE id = ${sqlValue(giftCardId)};
      `);

      return getGiftCardById(giftCardId);
    },

    deletePendingGiftCard(giftCardId) {
      const giftCard = getGiftCardById(giftCardId);
      if (!giftCard) {
        return null;
      }
      if (giftCard.status !== "pending") {
        const error = new Error("Only pending gift cards can be deleted");
        error.status = 400;
        throw error;
      }

      const deletionTimestamp = nowIso();

      runSql(`
        UPDATE coupon_usages
        SET
          gift_card_id = NULL,
          session_id = NULL,
          status = CASE
            WHEN status = 'applied-pending' THEN 'pending'
            ELSE status
          END,
          applied_at = CASE
            WHEN status = 'applied-pending' THEN NULL
            ELSE applied_at
          END,
          updated_at = ${sqlValue(deletionTimestamp)}
        WHERE
          gift_card_id = ${sqlValue(giftCardId)}
          OR validation_token = ${sqlValue(giftCard.coupon_token || "__no_coupon_token__")};
      `);

      runSql(`
        DELETE FROM payment_transactions
        WHERE gift_card_id = ${sqlValue(giftCardId)};
      `);

      runSql(`DELETE FROM gift_cards WHERE id = ${sqlValue(giftCardId)};`);
      return { success: true };
    },

    getGiftCardById(giftCardId) {
      return getGiftCardById(giftCardId);
    },

    activateGiftCard(giftCardId) {
      const giftCard = getGiftCardById(giftCardId);
      if (!giftCard) {
        return null;
      }
      if (giftCard.status !== "pending") {
        const error = new Error("Only pending gift cards can be activated");
        error.status = 400;
        throw error;
      }

      const expiresAt = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString();
      runSql(`
        UPDATE gift_cards
        SET
          code = ${sqlValue(generateGiftCode())},
          status = 'active',
          expires_at = ${sqlValue(expiresAt)},
          updated_at = ${sqlValue(nowIso())}
        WHERE id = ${sqlValue(giftCardId)};
      `);

      return getGiftCardById(giftCardId);
    },

    extendExpiry(giftCardId, newExpiryDateInput) {
      const newExpiryDate = normalizeIsoDate(newExpiryDateInput);
      if (!newExpiryDate) {
        const error = new Error("Invalid date format");
        error.status = 400;
        throw error;
      }

      runSql(`
        UPDATE gift_cards
        SET expires_at = ${sqlValue(newExpiryDate)}, updated_at = ${sqlValue(nowIso())}
        WHERE id = ${sqlValue(giftCardId)};
      `);

      const giftCard = getGiftCardById(giftCardId);
      if (!giftCard) {
        return null;
      }

      return { success: true, new_expiry_date: newExpiryDate };
    },

    updateRecipient(giftCardId, recipientNameInput) {
      const recipientName = String(recipientNameInput || "").trim();
      if (!recipientName) {
        const error = new Error("recipient_name is required");
        error.status = 400;
        throw error;
      }

      runSql(`
        UPDATE gift_cards
        SET recipient_name = ${sqlValue(recipientName)}, updated_at = ${sqlValue(nowIso())}
        WHERE id = ${sqlValue(giftCardId)};
      `);

      const giftCard = getGiftCardById(giftCardId);
      if (!giftCard) {
        return null;
      }

      return { success: true, recipient_name: recipientName };
    },

    async resendEmail(giftCardId) {
      const giftCard = getGiftCardById(giftCardId);
      if (!giftCard) {
        return null;
      }
      if (!giftCard.code) {
        const error = new Error("Gift card must have a code before sending email");
        error.status = 400;
        throw error;
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
        const error = new Error("Failed to send email");
        error.status = 500;
        throw error;
      }

      return { success: true };
    },
  };
}

module.exports = {
  createGiftCardsService,
};
