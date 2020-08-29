const Product = require('../models/product_model');
const User = require('../models/user_model');
const Order = require('../models/order_model');
const errorHandler = require('../utils/errorHandler');

exports.getMyCart = (req, res, next) => {
    req.user
        .populate('cart.product_id')
        .populate('cart.items.product_id')
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
                    let subItems = [];
                    let orderItems = [...user.cart].map((cartItem) => {
                        cartTotal +=
                            cartItem.product_id.price * cartItem.quantity;
                        if (cartItem.items.length) {
                            subItems = [...cartItem.items].map((subItem) => {
                                return {
                                    sub_item_id: subItem.product_id,
                                    quantity: subItem.quantity,
                                };
                            });
                        }
                        return {
                            item_id: cartItem.product_id._id,
                            sub_items: subItems,
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
                            let updateProducts = [];
                            orderItems.forEach((item) => {
                                updateProducts.push({
                                    item_id: item.item_id,
                                    quantity: item.quantity,
                                });
                                if (item.sub_items.length) {
                                    item.sub_items.forEach((sub_item) => {
                                        let isFound = updateProducts.findIndex(
                                            (product) =>
                                                product.item_id.toString() ===
                                                sub_item.sub_item_id.toString()
                                        );
                                        if (isFound === -1) {
                                            updateProducts.push({
                                                item_id: sub_item.sub_item_id,
                                                quantity: sub_item.quantity,
                                            });
                                        } else {
                                            updateProducts[isFound].quantity +=
                                                sub_item.quantity;
                                        }
                                    });
                                }
                            });
                            updateProducts.forEach((item, index) => {
                                Product.findById(item.item_id).then(
                                    (product) => {
                                        product.quantity -= item.quantity;
                                        product.save();
                                    }
                                );
                                if (updateProducts.length === index + 1) {
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
    Product.findOne({ _id: product_id, category: 'bar' }).then((product) => {
        if (product && product.quantity >= 1) {
            try {
                req.user.addToMixBox(product).then(() => {
                    res.send('Item added to mix box successfully');
                });
            } catch (err) {
                res.status(405).send({ message: err.message });
            }
        } else {
            next(errorHandler('Not allowed', 405));
        }
    });
};

exports.updateMixBox = (req, res, next) => {
    const { product_id, quantity } = req.body;
    Product.findOne({ _id: product_id, category: 'bar' }).then((product) => {
        if (product && product.quantity >= quantity) {
            try {
                req.user.updateMixBox(product_id, quantity).then(() => {
                    res.send('Item updated successfully');
                });
            } catch (err) {
                res.status(405).send({ message: err.message });
            }
        } else {
            next(errorHandler('Not allowed', 405));
        }
    });
};
exports.updateMixBoxLimit = (req, res, next) => {
    const { box_id } = req.body;
    try {
        Product.findOne({ _id: box_id, category: 'mix box' }).then(
            (product) => {
                if (product) {
                    let limit = product.name.replace(' bars', '');
                    req.user.updateMixBoxLimit(box_id, limit).then(() => {
                        res.send('Box updated successfully');
                    });
                } else {
                    next(errorHandler('Product not found', 405));
                }
            }
        );
    } catch (err) {
        res.status(405).send({ message: err.message });
    }
};

exports.addMixBoxToCart = (req, res, next) => {
    try {
        req.user.addMixBoxToCart().then(() => {
            req.user.clearMixBox().then(() => {
                res.send('Mix bos was added to cart successfully');
            });
        });
    } catch (err) {
        res.status(405).send({ message: err.message });
    }
};
exports.clearMixBox = (req, res, next) => {
    req.user.clearMixBox().then(() => {
        res.send('Mix box was cleared successfully');
    });
};

exports.addToLuxuryBox = (req, res, next) => {
    const { product_id } = req.body;
    Product.findOne({ _id: product_id, category: 'mini bar' }).then(
        (product) => {
            if (product && product.quantity >= 1) {
                try {
                    req.user.addToLuxuryBox(product).then(() => {
                        res.send('Item has been added successfully');
                    });
                } catch (err) {
                    res.status(405).send({ message: err.message });
                }
            } else {
                next(errorHandler('No allowed', 405));
            }
        }
    );
};
exports.updateLuxuryBox = (req, res, next) => {
    const { product_id, quantity } = req.body;
    Product.findOne({
        _id: product_id,
        category: 'mini bar',
    }).then((product) => {
        if (product && product.quantity >= quantity) {
            try {
                req.user.updateLuxuryBox(product_id, quantity).then(() => {
                    res.send('Item updated successfully');
                });
            } catch (err) {
                res.status(405).send({ message: err.message });
            }
        } else {
            next(errorHandler('No allowed', 405));
        }
    });
};
exports.updateLuxuryBoxSettings = (req, res, next) => {
    const { box_id, packaging_id } = req.body;
    Product.findOne({
        _id: box_id,
        category: 'luxury box',
    }).then((product) => {
        try {
            req.user.updateLuxuryBoxSettings(product, packaging_id).then(() => {
                res.send('box updated successfully');
            });
        } catch (err) {
            res.status(405).send({ message: err.message });
        }
    });
};
exports.clearLuxuryBox = (req, res, next) => {
    req.user.clearLuxuryBox().then(() => {
        res.send('Luxury box was cleared successfully');
    });
};
exports.addLuxuryBoxToCart = (req, res, next) => {
    try {
        req.user.addLuxuryBoxToCart().then(() => {
            req.user.clearLuxuryBox().then(() => {
                res.send('Luxury box was added to cart successfully');
            });
        });
    } catch (err) {
        res.status(405).send({ message: err.message });
    }
};
