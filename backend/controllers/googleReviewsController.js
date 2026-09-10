function createGoogleReviewsController({ googleReviewsService }) {
  return {
    async getReviews(req, res, next) {
      try {
        res.json(await googleReviewsService.getReviews());
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createGoogleReviewsController,
};
