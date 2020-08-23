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
    const { category, chocolate_type, page = 1 } = req.query;
    let total = 0;
    findObj = {};
    if (category) {
        findObj.category = category;
    }
    if (chocolate_type) {
        findObj.chocolate_type = chocolate_type;
    }
    Product.find(findObj)
        .count()
        .then((totalProducts) => {
            total = totalProducts;
            Product.find(findObj)
                .skip((page - 1) * 10)
                .limit(10)
                .then((products) => {
                    res.send({ products: products, total: total });
                })
                .catch((err) => {
                    res.status(500).send(err);
                });
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
