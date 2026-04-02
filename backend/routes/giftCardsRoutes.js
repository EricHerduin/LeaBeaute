const express = require("express");

function createGiftCardsRoutes({ giftCardsController, requireAdmin }) {
  const router = express.Router();

  router.post("/gift-cards/create-checkout", giftCardsController.createCheckout);
  router.get("/gift-cards/status/:sessionId", giftCardsController.getCheckoutStatus);
  router.post("/webhooks/stripe", giftCardsController.handleStripeWebhook);
  router.get("/gift-cards/verify/:code", giftCardsController.verifyGiftCard);
  router.post("/gift-cards/search", giftCardsController.searchGiftCards);
  router.post("/gift-cards/:giftCardId/redeem", requireAdmin, giftCardsController.redeemGiftCard);
  router.get("/gift-cards/list", requireAdmin, giftCardsController.listGiftCards);
  router.get("/gift-cards/all", requireAdmin, giftCardsController.listGiftCards);
  router.patch("/gift-cards/:giftCardId", requireAdmin, giftCardsController.updateGiftCardStatus);
  router.delete("/gift-cards/:giftCardId", requireAdmin, giftCardsController.deletePendingGiftCard);
  router.get("/gift-cards/:giftCardId", requireAdmin, giftCardsController.getGiftCardById);
  router.post("/gift-cards/:giftCardId/activate", requireAdmin, giftCardsController.activateGiftCard);
  router.patch("/gift-cards/:giftCardId/extend-expiry", requireAdmin, giftCardsController.extendExpiry);
  router.patch("/gift-cards/:giftCardId/update-recipient", requireAdmin, giftCardsController.updateRecipient);
  router.post("/gift-cards/:giftCardId/resend-email", requireAdmin, giftCardsController.resendEmail);

  return router;
}

module.exports = {
  createGiftCardsRoutes,
};
