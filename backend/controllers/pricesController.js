function createPricesController({ pricesService }) {
  return {
    getPublicPrices(req, res, next) {
      try {
        res.json(pricesService.getPublicPrices());
      } catch (error) {
        next(error);
      }
    },

    getAllPrices(req, res, next) {
      try {
        res.json(pricesService.getAllPrices());
      } catch (error) {
        next(error);
      }
    },

    getCategoryPreferences(req, res, next) {
      try {
        res.json(pricesService.getCategoryPreferences());
      } catch (error) {
        next(error);
      }
    },

    saveCategoryPreferences(req, res, next) {
      try {
        res.json(pricesService.saveCategoryPreferences(req.body));
      } catch (error) {
        next(error);
      }
    },

    createPrice(req, res, next) {
      try {
        res.json(pricesService.createPrice(req.body));
      } catch (error) {
        next(error);
      }
    },

    updatePrice(req, res, next) {
      try {
        const updated = pricesService.updatePrice(req.params.itemId, req.body);
        if (!updated) {
          res.status(404).json({ detail: "Price item not found" });
          return;
        }
        res.json(updated);
      } catch (error) {
        next(error);
      }
    },

    deletePrice(req, res, next) {
      try {
        const deleted = pricesService.deletePrice(req.params.itemId);
        if (!deleted) {
          res.status(404).json({ detail: "Price item not found" });
          return;
        }
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createPricesController,
};
