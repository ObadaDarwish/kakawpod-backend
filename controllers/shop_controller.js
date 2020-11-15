const Product = require('../models/product_model');
const Order = require('../models/order_model');
const Address = require('../models/address_model.js');
const Code = require('../models/code_model');
const errorHandler = require('../utils/errorHandler');
const {
    checkInStock,
    updateProducts,
    getItems,
} = require('./order_controller');
const sendEmail = require('../utils/email');

exports.getMyCart = (req, res, next) => {
    req.user
        .populate('cart.product_id')
        .populate('cart.box_packaging')
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
    Product.findOne({ _id: product_id, is_deleted: false }).then((product) => {
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
        Product.findOne({ _id: box_id, category: 'mixBox' }).then((product) => {
            if (product) {
                let limit = product.name.replace(' bars', '');
                req.user
                    .updateMixBoxLimit(
                        box_id,
                        limit,
                        product.name,
                        product.price
                    )
                    .then(() => {
                        res.send('Box updated successfully');
                    });
            } else {
                next(errorHandler('Product not found', 405));
            }
        });
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
    Product.findOne({ _id: product_id, category: 'miniBar' }).then(
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
        category: 'miniBar',
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
        category: 'luxuryBox',
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

exports.createOrder = (req, res, next) => {
    if (req.user.phone_verified) {
        if (req.body && req.body.address_id) {
            let discount = 0;
            let delivery_fees = 0;
            let promoCodeObj = null;
            let samplesList = [];
            let addressObj = {};
            const { address_id, promo_code = null, cart } = req.body;

            const checkSampleAvailability = (samples) => {
                let sampleAvailabilityPromise = new Promise(
                    (resolve, reject) => {
                        samplesList = samples.filter(
                            (sample) => sample.category === 'sample'
                        );
                        if (samplesList.length) {
                            samplesList.forEach((sample, index) => {
                                let isSampleFound = req.user.samples.findIndex(
                                    (item) =>
                                        item.toString() ===
                                        sample._id.toString()
                                );
                                if (isSampleFound >= 0) {
                                    reject({ type: 'sample' });
                                }
                                if (index + 1 === samplesList.length) {
                                    resolve();
                                }
                            });
                        } else {
                            resolve();
                        }
                    }
                );
                return sampleAvailabilityPromise;
            };

            checkSampleAvailability(req.body.cart)
                .then(() => {
                    return checkInStock(req.body.cart);
                })
                .then(() => {
                    if (cart.length) {
                        let orderItems = getItems(cart);
                        Address.findOne({
                            _id: address_id,
                            user_id: req.user._id,
                        })
                            .populate('delivery_fees_id')
                            .exec(function (err, address) {
                                if (err) {
                                    res.status(500).send(err);
                                } else {
                                    if (address) {
                                        addressObj = address;
                                        delivery_fees =
                                            address.delivery_fees_id.fee;
                                        validatePromoCode(promo_code, req.user)
                                            .then((promoCode) => {
                                                if (promoCode) {
                                                    promoCodeObj = promoCode;
                                                    discount =
                                                        orderItems.total *
                                                        (promoCode.percentage /
                                                            100);
                                                    if (
                                                        discount >
                                                        promoCode.max_discount
                                                    ) {
                                                        discount =
                                                            promoCode.max_discount;
                                                    }
                                                }
                                                let newOrder = new Order({
                                                    order_id:
                                                        req.user.name
                                                            .substr(0, 2)
                                                            .toUpperCase() +
                                                        Date.now(),
                                                    items: orderItems.list,
                                                    address_id: address_id,
                                                    status: 'pending',
                                                    sub_total: orderItems.total,
                                                    discount: discount,
                                                    total: Math.floor(
                                                        orderItems.total -
                                                            discount +
                                                            delivery_fees
                                                    ),
                                                    order_type: 'online',
                                                    user_id: req.user._id,
                                                });
                                                newOrder
                                                    .save()
                                                    .then((savedOrder) => {
                                                        let mailItems = cart.map(
                                                            (cartItem) => {
                                                                return {
                                                                    ...cartItem,
                                                                    image:
                                                                        cartItem
                                                                            .images[0]
                                                                            .url,
                                                                };
                                                            }
                                                        );
                                                        sendEmail(
                                                            req.user.email,
                                                            'Order',
                                                            'd-0a47ed2cfbc24571849fde9dca426794',
                                                            {
                                                                subject:
                                                                    'Order',
                                                                order_no:
                                                                    savedOrder.order_id,
                                                                items: mailItems,
                                                                payment_method:
                                                                    'COD',
                                                                sub_total: `EGP${orderItems.total}`,
                                                                shipping: `EGP${delivery_fees}`,
                                                                discount: `EGP${discount}`,
                                                                total: `EGP${
                                                                    orderItems.total -
                                                                    discount +
                                                                    delivery_fees
                                                                }`,
                                                                address: {
                                                                    apartment:
                                                                        addressObj.apartment,
                                                                    floor:
                                                                        addressObj.floor,
                                                                    building:
                                                                        addressObj.building,
                                                                    street:
                                                                        addressObj.street,
                                                                    area:
                                                                        addressObj.area,
                                                                    city:
                                                                        addressObj.city,
                                                                    country:
                                                                        addressObj.country,
                                                                },
                                                            }
                                                        ).catch((err) => {
                                                            res.status(
                                                                500
                                                            ).send(err);
                                                        });
                                                        updateProducts(
                                                            orderItems.list,
                                                            promoCodeObj,
                                                            req.user._id
                                                        )
                                                            .then(() => {
                                                                req.user
                                                                    .updateSampleList(
                                                                        samplesList
                                                                    )
                                                                    .then(
                                                                        () => {
                                                                            res.send(
                                                                                'Ordered has been submitted successfully'
                                                                            );
                                                                        }
                                                                    )
                                                                    .catch(
                                                                        (
                                                                            err
                                                                        ) => {
                                                                            next(
                                                                                errorHandler(
                                                                                    err.message,
                                                                                    405
                                                                                )
                                                                            );
                                                                        }
                                                                    );
                                                            })
                                                            .catch((err) => {
                                                                next(
                                                                    errorHandler(
                                                                        err.message,
                                                                        405
                                                                    )
                                                                );
                                                            });
                                                    })
                                                    .catch((err) => {
                                                        res.status(500).send(
                                                            err
                                                        );
                                                    });
                                            })
                                            .catch((err) => {
                                                res.status(500).send(err);
                                            });
                                    } else {
                                        next(
                                            errorHandler(
                                                'Can not find address',
                                                405
                                            )
                                        );
                                    }
                                }
                            });
                    } else {
                        next(errorHandler('cart is empty', 405));
                    }
                })
                .catch((err) => {
                    if (err.type === 'stock') {
                        res.status(405).send({
                            message: 'Out of stock',
                            data: err.data,
                        });
                    }
                    if (err.type === 'sample') {
                        next(
                            errorHandler(
                                'one sample of each type is allowed',
                                405
                            )
                        );
                    }
                });
        } else {
            next(errorHandler('address id is required', 405));
        }
    } else {
        next(errorHandler('Please verify your phone number', 405));
    }
};
const validatePromoCode = (code, user) => {
    if (code) {
        return Code.findOne({
            code: code.toLowerCase(),
            is_active: true,
            count: { $gt: 0 },
            users: { $nin: [user._id] },
        });
    } else {
        return new Promise((resolve) => {
            resolve(null);
        });
    }
};
exports.validateDiscount = (req, res, next) => {
    const discount_code = req.body.code;
    validatePromoCode(discount_code, req.user).then((code) => {
        if (code) {
            res.send({
                percentage: code.percentage,
                max_discount: code.max_discount,
            });
        } else {
            next(errorHandler('Invalid or Expired code', 405));
        }
    });
};
