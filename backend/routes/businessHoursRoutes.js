const express = require("express");

function createBusinessHoursRoutes({ businessHoursController, requireAdmin }) {
  const router = express.Router();

  router.get("/business-hours", businessHoursController.getBusinessHours);
  router.post("/business-hours", requireAdmin, businessHoursController.saveBusinessHours);
  router.get("/business-hours/exceptions", businessHoursController.listExceptions);
  router.post("/business-hours/exceptions", requireAdmin, businessHoursController.saveException);
  router.delete("/business-hours/exceptions/:date", requireAdmin, businessHoursController.deleteException);
  router.get("/business-hours/holidays", businessHoursController.listHolidays);
  router.post("/business-hours/holidays", requireAdmin, businessHoursController.saveHoliday);
  router.delete("/business-hours/holidays/:date", requireAdmin, businessHoursController.deleteHoliday);
  router.get("/business-hours/status", businessHoursController.getStatus);

  return router;
}

module.exports = {
  createBusinessHoursRoutes,
};
