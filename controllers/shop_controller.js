const Product = require('../models/product_model');
const User = require('../models/user_model');
const Order = require('../models/order_model');
const errorHandler = require('../utils/errorHandler');

exports.getMyCart = (req, res, next) => {
    req.user
        .populate('cart.product_id')
        .execPopulate()
        .then((products) => {
            res.send(products.cart);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
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

exports.createOrder = (req, res, next) => {
    if (req.body && req.body.address_id) {
        const { address_id } = req.body;
        req.user
            .populate('cart.product_id')
            .execPopulate()
            .then((user) => {
                if (user.cart.length) {
                    let cartTotal = 0;
                    let orderItems = [...user.cart].map((cartItem) => {
                        cartTotal +=
                            cartItem.product_id.price * cartItem.quantity;
                        return {
                            item_id: cartItem.product_id._id,
                            price: cartItem.product_id.price,
                            quantity: cartItem.quantity,
                        };
                    });
                    let newOrder = new Order({
                        items: orderItems,
                        address_id: address_id,
                        status: 'pending',
                        total: cartTotal,
                        user_id: req.user._id,
                    });
                    newOrder
                        .save()
                        .then((order) => {
                            return req.user.clearCart();
                        })
                        .then(() => {
                            orderItems.forEach((item, index) => {
                                Product.findById(item.item_id).then(
                                    (product) => {
                                        product.quantity =
                                            product.quantity - item.quantity;
                                        product.save();
                                    }
                                );
                                if (orderItems.length === index + 1) {
                                    res.send('Order saved successfully');
                                }
                            });
                        })
                        .catch((err) => {
                            res.status(500).send(err);
                        });
                } else {
                    next(errorHandler('cart is empty', 405));
                }
            });
    } else {
        next(errorHandler('address id is required', 405));
    }
};

exports.addToMixBox = (req, res, next) => {
    const { product_id } = req.body;
    Product.find({ _id: product_id, category: 'bar' }).then((product) => {
        if (product.length) {
            try {
                req.user.addToMixBox(product).then(() => {
                    res.send('Item added to mix box successfully');
                });
            } catch (err) {
                res.status(405).send({ message: err.message });
            }
        } else {
            next(
                errorHandler('you can only add chocolate bars to mix box', 405)
            );
        }
    });
};

exports.updateMixBox = (req, res, next) => {
    const { product_id, quantity } = req.body;
    try {
        req.user.updateMixBox(product_id, quantity).then(() => {
            res.send('Item updated successfully');
        });
    } catch (err) {
        res.status(405).send({ message: err.message });
    }
};
