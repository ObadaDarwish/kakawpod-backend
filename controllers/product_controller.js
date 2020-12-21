const Product = require('../models/product_model');

exports.getProduct = (req, res, next) => {
    const productId = req.params.code;
    Product.findOne(
        { _id: productId, is_deleted: false },
        {
            quantity: 0,
            sold: 0,
            min_quantity: 0,
            user_id: 0,
        }
    )
        .then((product) => {
            res.send(product);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
exports.getTopSellingProducts = (req, res, next) => {
    Product.find(
        {
            $query: {
                $or: [{ category: 'bar' }, { category: 'cooking' }],
                is_deleted: false,
            },
            $orderby: { sold: -1 },
        },
        {
            quantity: 0,
            sold: 0,
            min_quantity: 0,
            user_id: 0,
        }
    )
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
        let findObj = { is_deleted: false };
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
            Product.find(getObj(), {
                quantity: 0,
                sold: 0,
                min_quantity: 0,
                user_id: 0,
            })
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
