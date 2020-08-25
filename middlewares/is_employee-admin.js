const errorHandler = require('../utils/errorHandler');

module.exports = (req, res, next) => {
    if (req.user.authority === 1 || req.user.authority === 2) {
        next();
    } else {
        next(errorHandler('Not authorized', 405));
    }
};
