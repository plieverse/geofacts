const authMiddleware = require('./auth');

module.exports = function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (!req.user || !req.user.is_admin) {
      return res.status(403).json({ error: 'Geen beheerdersrechten.' });
    }
    next();
  });
};
