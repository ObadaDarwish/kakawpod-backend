const Product = require('../models/product_model');
const User = require('../models/user_model');
const errorHandler = require('../utils/errorHandler');

exports.addToCart = (req, res, next) => {
    const { product_id } = req.body;
    const userId = req.user._id;
    Product.findById(product_id).then((product) => {
        if (product) {
            try {
                req.user.addToCart(product).then(() => {
                    res.send('Item added to cart successfully');
                });
            } catch (err) {
                res.status(405).send({ message: err.message });
            }
        } else {
            next(errorHandler('Product not found', 405));
        }
    });
};

exports.removeFromCart = (req, res, next) => {
    const itemId = req.params.code;
    req.user
        .removeFromCart(itemId)
        .then(() => {
            res.send('Item removed from cart successfully');
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
exports.clearCart = (req, res, next) => {
    req.user
        .clearCart()
        .then(() => {
            res.send('cart cleared successfully');
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
exports.updateCart = (req, res, next) => {
    const quantity = req.body.quantity;
    const itemId = req.params.code;
    try {
        req.user.updateCart(itemId, quantity).then(() => {
            res.send('item updated successfully');
        });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};
