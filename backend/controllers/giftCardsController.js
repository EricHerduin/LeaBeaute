function createGiftCardsController({ giftCardsService }) {
  return {
    async createCheckout(req, res, next) {
      try {
        res.json(await giftCardsService.createCheckout(req.body));
      } catch (error) {
        next(error);
      }
    },

    async getCheckoutStatus(req, res, next) {
      try {
        const result = await giftCardsService.getCheckoutStatus(req.params.sessionId);
        if (!result) {
          res.status(404).json({ detail: "Transaction not found" });
          return;
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    },

    handleStripeWebhook(req, res, next) {
      try {
        res.json(giftCardsService.handleStripeWebhook(req.body, req.headers["stripe-signature"]));
      } catch (error) {
        next(error);
      }
    },

    verifyGiftCard(req, res, next) {
      try {
        res.json(giftCardsService.verifyGiftCard(req.params.code));
      } catch (error) {
        next(error);
      }
    },

    searchGiftCards(req, res, next) {
      try {
        res.json(
          giftCardsService.searchGiftCards(
            String(req.query.query || ""),
            String(req.query.search_type || "code"),
          ),
        );
      } catch (error) {
        next(error);
      }
    },

    redeemGiftCard(req, res, next) {
      try {
        const result = giftCardsService.redeemGiftCard(req.params.giftCardId);
        if (!result) {
          res.status(404).json({ detail: "Gift card not found" });
          return;
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    },

    listGiftCards(req, res, next) {
      try {
        res.json(giftCardsService.listGiftCards());
      } catch (error) {
        next(error);
      }
    },

    updateGiftCardStatus(req, res, next) {
      try {
        const result = giftCardsService.updateGiftCardStatus(req.params.giftCardId, req.query.status);
        if (!result) {
          res.status(404).json({ detail: "Gift card not found" });
          return;
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    },

    deletePendingGiftCard(req, res, next) {
      try {
        const result = giftCardsService.deletePendingGiftCard(req.params.giftCardId);
        if (!result) {
          res.status(404).json({ detail: "Gift card not found" });
          return;
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    },

    getGiftCardById(req, res, next) {
      try {
        const giftCard = giftCardsService.getGiftCardById(req.params.giftCardId);
        if (!giftCard) {
          res.status(404).json({ detail: "Gift card not found" });
          return;
        }
        res.json(giftCard);
      } catch (error) {
        next(error);
      }
    },

    activateGiftCard(req, res, next) {
      try {
        const result = giftCardsService.activateGiftCard(req.params.giftCardId);
        if (!result) {
          res.status(404).json({ detail: "Gift card not found" });
          return;
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    },

    extendExpiry(req, res, next) {
      try {
        const result = giftCardsService.extendExpiry(req.params.giftCardId, req.body.new_expiry_date);
        if (!result) {
          res.status(404).json({ detail: "Gift card not found" });
          return;
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    },

    updateRecipient(req, res, next) {
      try {
        const result = giftCardsService.updateRecipient(req.params.giftCardId, req.body.recipient_name);
        if (!result) {
          res.status(404).json({ detail: "Gift card not found" });
          return;
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    },

    async resendEmail(req, res, next) {
      try {
        const result = await giftCardsService.resendEmail(req.params.giftCardId);
        if (!result) {
          res.status(404).json({ detail: "Gift card not found" });
          return;
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createGiftCardsController,
};
