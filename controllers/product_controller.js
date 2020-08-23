const Product = require('../models/product_model');

exports.getProduct = (req, res, next) => {
    const productId = req.params.code;
    Product.findById(productId)
        .then((product) => {
            res.send(product);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};

exports.getAllProduct = (req, res, next) => {
    const { category, chocolate_type } = req.query;
    findObj = {};
    if (category) {
        findObj.category = category;
    }
    if (chocolate_type) {
        findObj.chocolate_type = chocolate_type;
    }
    Product.find(findObj)
        .then((products) => {
            res.send(products);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
