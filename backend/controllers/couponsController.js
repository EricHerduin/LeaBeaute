function createCouponsController({ couponsService }) {
  return {
    createCoupon(req, res, next) {
      try {
        res.json(couponsService.createCoupon(req.body));
      } catch (error) {
        next(error);
      }
    },

    listCoupons(req, res, next) {
      try {
        res.json(couponsService.listCoupons());
      } catch (error) {
        next(error);
      }
    },

    updateCoupon(req, res, next) {
      try {
        const coupon = couponsService.updateCoupon(req.params.couponId, req.body);
        if (!coupon) {
          res.status(404).json({ detail: "Coupon not found" });
          return;
        }
        res.json(coupon);
      } catch (error) {
        next(error);
      }
    },

    deleteCoupon(req, res, next) {
      try {
        const deleted = couponsService.deleteCoupon(req.params.couponId);
        if (!deleted) {
          res.status(404).json({ detail: "Coupon not found" });
          return;
        }
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    },

    validateCoupon(req, res, next) {
      try {
        res.json(couponsService.validateCoupon(req.query.code));
      } catch (error) {
        next(error);
      }
    },

    applyCoupon(req, res, next) {
      try {
        res.json(couponsService.applyCoupon(req.query.token, req.query.session_id));
      } catch (error) {
        next(error);
      }
    },

    cancelCoupon(req, res, next) {
      try {
        res.json(couponsService.cancelCoupon(req.params.token));
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createCouponsController,
};
