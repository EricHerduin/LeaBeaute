const express = require("express");

function createGiftCardsRoutes({ giftCardsController, requireAdmin }) {
  const router = express.Router();

  router.post("/gift-cards/create-checkout", giftCardsController.createCheckout);
  router.get("/gift-cards/status/:sessionId", giftCardsController.getCheckoutStatus);
  router.get("/gift-cards/status/:sessionId/pdf", giftCardsController.getGiftCardPdfBySession);
  router.post("/webhooks/stripe", giftCardsController.handleStripeWebhook);
  router.get("/gift-cards/verify/:code", giftCardsController.verifyGiftCard);
  router.get("/gift-cards/search", giftCardsController.searchGiftCards);
  router.post("/gift-cards/search", giftCardsController.searchGiftCards);
  router.post("/gift-cards/:giftCardId/redeem", requireAdmin, giftCardsController.redeemGiftCard);
  router.get("/gift-cards/list", requireAdmin, giftCardsController.listGiftCards);
  router.get("/gift-cards/all", requireAdmin, giftCardsController.listGiftCards);
  router.patch("/gift-cards/:giftCardId", requireAdmin, giftCardsController.updateGiftCardStatus);
  router.delete("/gift-cards/:giftCardId", requireAdmin, giftCardsController.deletePendingGiftCard);
  router.get("/gift-cards/:giftCardId/pdf", requireAdmin, giftCardsController.getGiftCardPdf);
  router.get("/gift-cards/:giftCardId/stripe-status", requireAdmin, giftCardsController.getGiftCardStripeStatus);
  router.post("/gift-cards/:giftCardId/reconcile-stripe", requireAdmin, giftCardsController.reconcileGiftCardStripePayment);
  router.get("/gift-cards/:giftCardId", requireAdmin, giftCardsController.getGiftCardById);
  router.post("/gift-cards/:giftCardId/activate", requireAdmin, giftCardsController.activateGiftCard);
  router.patch("/gift-cards/:giftCardId/extend-expiry", requireAdmin, giftCardsController.extendExpiry);
  router.patch("/gift-cards/:giftCardId/update-recipient", requireAdmin, giftCardsController.updateRecipient);
  router.patch("/gift-cards/:giftCardId/update-message", requireAdmin, giftCardsController.updatePersonalMessage);
  router.post("/gift-cards/:giftCardId/resend-email", requireAdmin, giftCardsController.resendEmail);
  router.post("/gift-cards/test-email", requireAdmin, giftCardsController.sendTestEmail);

  return router;
}

module.exports = {
  createGiftCardsRoutes,
};
