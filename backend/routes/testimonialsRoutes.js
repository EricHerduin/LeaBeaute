const express = require("express");

function createTestimonialsRoutes({ testimonialsController }) {
  const router = express.Router();

  router.post("/testimonials", testimonialsController.createTestimonial);
  router.get("/testimonials", testimonialsController.listApprovedTestimonials);

  return router;
}

module.exports = {
  createTestimonialsRoutes,
};
