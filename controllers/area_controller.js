const Area = require('../models/area_model');

exports.getAreas = (req, res, next) => {
    Area.find()
        .then((areas) => {
            res.send(areas);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
