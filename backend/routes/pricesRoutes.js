const express = require("express");

function createPricesRoutes({ pricesController, requireAdmin }) {
  const router = express.Router();

  router.get("/prices", pricesController.getPublicPrices);
  router.get("/prices/all", requireAdmin, pricesController.getAllPrices);
  router.get("/prices/category-preferences", requireAdmin, pricesController.getCategoryPreferences);
  router.put("/prices/category-preferences", requireAdmin, pricesController.saveCategoryPreferences);
  router.post("/prices", requireAdmin, pricesController.createPrice);
  router.put("/prices/:itemId", requireAdmin, pricesController.updatePrice);
  router.delete("/prices/:itemId", requireAdmin, pricesController.deletePrice);

  return router;
}

module.exports = {
  createPricesRoutes,
};
