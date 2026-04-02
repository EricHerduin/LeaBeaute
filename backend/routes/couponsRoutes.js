const express = require("express");

function createCouponsRoutes({ couponsController, requireAdmin }) {
  const router = express.Router();

  router.post("/coupons", requireAdmin, couponsController.createCoupon);
  router.get("/coupons", requireAdmin, couponsController.listCoupons);
  router.get("/coupons/all", requireAdmin, couponsController.listCoupons);
  router.put("/coupons/:couponId", requireAdmin, couponsController.updateCoupon);
  router.delete("/coupons/:couponId", requireAdmin, couponsController.deleteCoupon);
  router.post("/coupons/validate", couponsController.validateCoupon);
  router.post("/coupons/apply", couponsController.applyCoupon);
  router.post("/coupons/cancel/:token", couponsController.cancelCoupon);

  return router;
}

module.exports = {
  createCouponsRoutes,
};
