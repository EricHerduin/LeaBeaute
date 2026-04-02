function createBusinessHoursController({ businessHoursService }) {
  return {
    getBusinessHours(req, res, next) {
      try {
        res.json(businessHoursService.getBusinessHours());
      } catch (error) {
        next(error);
      }
    },

    saveBusinessHours(req, res, next) {
      try {
        res.json(businessHoursService.saveBusinessHours(req.body));
      } catch (error) {
        next(error);
      }
    },

    listExceptions(req, res, next) {
      try {
        res.json(businessHoursService.listExceptions());
      } catch (error) {
        next(error);
      }
    },

    saveException(req, res, next) {
      try {
        res.json(businessHoursService.saveException(req.body));
      } catch (error) {
        next(error);
      }
    },

    deleteException(req, res, next) {
      try {
        const deleted = businessHoursService.deleteException(req.params.date);
        if (!deleted) {
          res.status(404).json({ detail: "Exception not found" });
          return;
        }
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    },

    listHolidays(req, res, next) {
      try {
        res.json(businessHoursService.listHolidays());
      } catch (error) {
        next(error);
      }
    },

    saveHoliday(req, res, next) {
      try {
        res.json(businessHoursService.saveHoliday(req.body));
      } catch (error) {
        next(error);
      }
    },

    deleteHoliday(req, res, next) {
      try {
        const deleted = businessHoursService.deleteHoliday(req.params.date);
        if (!deleted) {
          res.status(404).json({ detail: "Holiday not found" });
          return;
        }
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    },

    getStatus(req, res, next) {
      try {
        res.json(businessHoursService.getStatus());
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createBusinessHoursController,
};
