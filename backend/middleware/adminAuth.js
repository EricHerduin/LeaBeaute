function createRequireAdmin({ adminPassword }) {
  return function requireAdmin(req, res, next) {
    if (req.headers.authorization !== adminPassword) {
      res.status(401).json({ detail: "Unauthorized" });
      return;
    }
    next();
  };
}

module.exports = {
  createRequireAdmin,
};
