function createTestimonialsController({ testimonialsService }) {
  return {
    createTestimonial(req, res, next) {
      try {
        res.json(testimonialsService.createTestimonial(req.body));
      } catch (error) {
        next(error);
      }
    },

    listApprovedTestimonials(req, res, next) {
      try {
        res.json(testimonialsService.listApprovedTestimonials(req.query.limit));
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createTestimonialsController,
};
