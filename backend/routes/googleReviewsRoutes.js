const express = require("express");

function createGoogleReviewsRoutes({ googleReviewsController }) {
  const router = express.Router();

  router.get("/google-reviews", googleReviewsController.getReviews);

  return router;
}

module.exports = {
  createGoogleReviewsRoutes,
};
