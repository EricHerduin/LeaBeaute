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

    async getGiftCardPdfBySession(req, res, next) {
      try {
        const result = await giftCardsService.generateGiftCardPdfBySessionId(req.params.sessionId);
        if (!result) {
          res.status(404).json({ detail: "Gift card PDF not found" });
          return;
        }
        const safeCode = String(result.giftCard.code || "carte-cadeau").replace(/[^A-Za-z0-9_-]/g, "-");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="carte-cadeau-${safeCode}.pdf"`);
        res.send(result.pdfBuffer);
      } catch (error) {
        next(error);
      }
    },

    async handleStripeWebhook(req, res, next) {
      try {
        const result = await giftCardsService.handleStripeWebhook(
          req.body,
          req.headers["stripe-signature"],
        );
        res.json(result);
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

    async getGiftCardStripeStatus(req, res, next) {
      try {
        const result = await giftCardsService.getGiftCardStripeStatus(req.params.giftCardId);
        if (!result) {
          res.status(404).json({ detail: "Gift card not found" });
          return;
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    },

    async reconcileGiftCardStripePayment(req, res, next) {
      try {
        const result = await giftCardsService.reconcileGiftCardStripePayment(req.params.giftCardId);
        if (!result) {
          res.status(404).json({ detail: "Gift card not found" });
          return;
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    },

    async getGiftCardPdf(req, res, next) {
      try {
        const result = await giftCardsService.generateGiftCardPdf(req.params.giftCardId);
        if (!result) {
          res.status(404).json({ detail: "Gift card PDF not found" });
          return;
        }
        const safeCode = String(result.giftCard.code || "carte-cadeau").replace(/[^A-Za-z0-9_-]/g, "-");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="carte-cadeau-${safeCode}.pdf"`);
        res.send(result.pdfBuffer);
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
        const result = giftCardsService.updateRecipient(
          req.params.giftCardId,
          req.body.recipient_name,
          req.body.personal_message ?? req.body.personalMessage,
        );
        if (!result) {
          res.status(404).json({ detail: "Gift card not found" });
          return;
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    },

    updatePersonalMessage(req, res, next) {
      try {
        const result = giftCardsService.updatePersonalMessage(
          req.params.giftCardId,
          req.body.personal_message ?? req.body.personalMessage,
        );
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
        const result = await giftCardsService.resendEmail(req.params.giftCardId, req.body);
        if (!result) {
          res.status(404).json({ detail: "Gift card not found" });
          return;
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    },

    async sendTestEmail(req, res, next) {
      try {
        const result = await giftCardsService.sendTestEmail(req.body);
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
