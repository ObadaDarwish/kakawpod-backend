const Area = require('../models/area_model');

exports.getAreas = (req, res, next) => {
    let { city } = req.query;
    Area.find({ city: city })
        .then((areas) => {
            res.send(areas);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
