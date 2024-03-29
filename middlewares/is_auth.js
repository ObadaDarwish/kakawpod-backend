const jwt = require('jsonwebtoken');
const User = require('../models/user_model');

module.exports = (req, res, next) => {
    jwt.verify(req.headers.token, process.env.JWT_SECRET, (err, data) => {
        if (!err) {
            User.findById(data._id).then((result) => {
                req.user = result;
                next();
            }).catch(err => {
                err.statusCode = 403;
                next(err);
            });
        } else {
            res.status(405).send('Authentication is required!');
        }
    })
};
