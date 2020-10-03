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
    const { category, type, page = 1 } = req.query;
    let total = 0;

    const getObj = () => {
        findObj = {};
        if (category) {
            findObj.category = category;
        }
        if (type) {
            findObj.chocolate_type = type;
        }
        return findObj;
    };

    Product.find(getObj())
        .count()
        .then((totalProducts) => {
            total = totalProducts;
            Product.find(getObj())
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
