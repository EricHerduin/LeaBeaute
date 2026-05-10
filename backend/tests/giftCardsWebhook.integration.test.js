const test = require("node:test");
const assert = require("node:assert/strict");

const { createGiftCardsService } = require("../services/giftCardsService");

function createServiceForWebhook({
  constructEvent,
  transaction = null,
  activatedGiftCard = { id: "gc_1", status: "active" },
}) {
  const activateCalls = [];

  const service = createGiftCardsService({
    stripe: {
      webhooks: {
        constructEvent,
      },
    },
    stripeWebhookSecret: "whsec_test",
    getPaymentTransactionBySessionId: () => transaction,
    activateGiftCardAfterPayment: async (payload) => {
      activateCalls.push(payload);
      return activatedGiftCard;
    },
  });

  return { service, activateCalls };
}

test("handleStripeWebhook rejette une signature invalide", async () => {
  const { service } = createServiceForWebhook({
    constructEvent: () => {
      throw new Error("Invalid payload signature");
    },
  });

  await assert.rejects(
    service.handleStripeWebhook(Buffer.from("{}"), "bad_sig"),
    (error) => {
      assert.equal(error.message, "Invalid signature");
      assert.equal(error.status, 400);
      return true;
    },
  );
});

test("handleStripeWebhook ignore les evenements hors checkout.session.completed", async () => {
  const { service, activateCalls } = createServiceForWebhook({
    constructEvent: () => ({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_1" } },
    }),
  });

  const result = await service.handleStripeWebhook(Buffer.from("{}"), "sig_ok");

  assert.deepEqual(result, {
    status: "ignored",
    event_type: "payment_intent.succeeded",
  });
  assert.equal(activateCalls.length, 0);
});

test("handleStripeWebhook ignore checkout.session.completed si paiement non paye", async () => {
  const { service, activateCalls } = createServiceForWebhook({
    constructEvent: () => ({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_1",
          payment_status: "unpaid",
          status: "open",
          metadata: {},
        },
      },
    }),
  });

  const result = await service.handleStripeWebhook(Buffer.from("{}"), "sig_ok");

  assert.deepEqual(result, {
    status: "ignored",
    reason: "payment_not_paid",
    payment_status: "unpaid",
  });
  assert.equal(activateCalls.length, 0);
});

test("handleStripeWebhook renvoie 404 si transaction introuvable", async () => {
  const { service } = createServiceForWebhook({
    constructEvent: () => ({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_missing_tx",
          payment_status: "paid",
          status: "complete",
          metadata: {},
        },
      },
    }),
    transaction: null,
  });

  await assert.rejects(
    service.handleStripeWebhook(Buffer.from("{}"), "sig_ok"),
    (error) => {
      assert.equal(error.message, "Transaction not found for Stripe session");
      assert.equal(error.status, 404);
      return true;
    },
  );
});

test("handleStripeWebhook active la carte cadeau apres checkout.session.completed paye", async () => {
  const transaction = {
    gift_card_id: "gift_123",
    coupon_token: "token_abc",
  };

  const { service, activateCalls } = createServiceForWebhook({
    constructEvent: () => ({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_paid_1",
          payment_status: "paid",
          status: "complete",
          metadata: { gift_card_id: "gift_123" },
        },
      },
    }),
    transaction,
    activatedGiftCard: { id: "gift_123", status: "active" },
  });

  const result = await service.handleStripeWebhook(Buffer.from("{}"), "sig_ok");

  assert.equal(activateCalls.length, 1);
  assert.deepEqual(activateCalls[0], {
    giftCardId: "gift_123",
    sessionId: "cs_paid_1",
    couponToken: "token_abc",
  });

  assert.deepEqual(result, {
    status: "success",
    event_type: "checkout.session.completed",
    gift_card_id: "gift_123",
    gift_card_status: "active",
  });
});
