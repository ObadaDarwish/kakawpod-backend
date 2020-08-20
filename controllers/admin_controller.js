const Product = require('../models/product_model');

exports.createProduct = (req, res, next) => {
    let newProducts = new Product({...req.body, user_id: req.user._id});
    newProducts.save().then(() => {
        res.send('product saved successfully');
    }).catch(err => {
        res.status(500).send(err)
    })
};

exports.uploadProductImage = (req, res, next) => {
    const file = req.file;
    if (!file) {
        let error = new Error();
        error = {...error, statusCode: 403, message: 'file type is not supported'};
        throw error;
    } else {
        res.json({
            message: 'image uploaded successfully',
            url: process.env.FRONTEND_DOMAIN + "/images/" + file.filename
        })
    }
};
