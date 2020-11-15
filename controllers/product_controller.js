const Product = require('../models/product_model');

exports.getProduct = (req, res, next) => {
    const productId = req.params.code;
    Product.findOne({ _id: productId, is_deleted: false })
        .then((product) => {
            res.send(product);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
exports.getTopSellingProducts = (req, res, next) => {
    Product.find({
        $or: [{ category: 'bar' }, { category: 'cooking' }],
        is_deleted: false,
    })
        .sort({ sold: -1 })
        .limit(10)
        .exec(function (err, products) {
            if (err) {
                res.status(500).send(err);
            } else {
                return res.send(products);
            }
        });
};
exports.getAllProduct = (req, res, next) => {
    const { category, type, page = 1 } = req.query;
    let total = 0;

    const getObj = () => {
        findObj = { is_deleted: false };
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
