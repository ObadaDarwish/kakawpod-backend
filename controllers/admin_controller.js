const Product = require('../models/product_model');
const Order = require('../models/order_model');
const Code = require('../models/code_model');
const moment = require('moment');
const crypto = require('crypto');
const errorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/email');
const {
    checkInStock,
    getItems,
    updateProducts,
} = require('./order_controller');
exports.getProducts = (req, res, next) => {
    const { page } = req.query;
    Product.find()
        .count()
        .then((total) => {
            Product.find()
                .skip((page - 1) * 20)
                .limit(20)
                .then((products) => {
                    res.send({ docs: products, total: total });
                })
                .catch((err) => {
                    res.status(500).send(err);
                });
        });
};
exports.createProduct = (req, res, next) => {
    let newProducts = new Product({ ...req.body, user_id: req.user._id });
    newProducts
        .save()
        .then((product) => {
            res.send({
                message: 'product saved successfully',
                product: product,
            });
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};

exports.uploadProductImage = (req, res, next) => {
    const file = req.file;
    if (!file) {
        let error = new Error();
        error = {
            ...error,
            statusCode: 403,
            message: 'file type is not supported',
        };
        throw error;
    } else {
        res.json({
            message: 'image uploaded successfully',
            images: file.images,
        });
    }
};

exports.updateProduct = (req, res, next) => {
    const productID = req.params.code;
    Product.findOneAndUpdate(
        { _id: productID, user_id: req.user._id },
        req.body,
        (err, result) => {
            if (result) {
                if (!err) {
                    res.send({
                        message: 'Product was successfully updated',
                        product: result,
                    });
                } else {
                    res.status(500).send(err);
                }
            } else {
                next(errorHandler('Not authorized!', 405));
            }
        }
    ).catch((err) => {
        res.status(500).send(err);
    });
};

exports.toggleDeleteProduct = (req, res, next) => {
    const productID = req.params.code;
    Product.findOne({
        _id: productID,
        user_id: req.user._id,
    }).then((selectedProduct) => {
        Product.findOneAndUpdate(
            { _id: productID, user_id: req.user._id },
            { is_deleted: !selectedProduct.is_deleted },
            (err, result) => {
                if (result) {
                    if (!err) {
                        res.send('Product was deleted successfully');
                    } else {
                        res.status(500).send(err);
                    }
                } else {
                    next(errorHandler('Not authorized!', 405));
                }
            }
        ).catch((err) => {
            res.status(500).send(err);
        });
    });
};

exports.getOrders = (req, res, next) => {
    // start_at timestamp  start of day
    // end_at timestamp end of day
    // let currentDate = new Date().getTime() / 1000;
    let total = 0;
    let { status = 'pending', start_at, end_at, page = 1 } = req.query;
    const getObj = () => {
        findObj = {};
        findObj.status = status;
        if (start_at && end_at) {
            if (start_at === end_at) {
                end_at = parseInt(end_at) + 86400;
            }
            findObj.createdAt = {
                $gte: moment.unix(start_at).format(),
                $lte: moment.unix(end_at).format(),
            };
        }
        return findObj;
    };
    Order.find(getObj())
        .count()
        .then((totalOrders) => {
            total = totalOrders;
            Order.find(getObj())
                .sort({ createdAt: -1 })
                .skip((page - 1) * 20)
                .limit(20)
                .populate([
                    {
                        path: 'items.item_id',
                    },
                    {
                        path: 'items.sub_items.sub_item_id',
                    },
                    {
                        path: 'user_id',
                    },
                ])
                .exec(function (err, orders) {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        return res.send({ orders: orders, total: total });
                    }
                });
        });
};
exports.updateCompletedOrder = (req, res, next) => {
    const { code } = req.params;
    const { OTP } = req.body;
    let items = [];
    const handleOrder = () => {
        Order.findOne({ _id: code })
            .populate('items.item_id')
            .populate('items.sub_items.sub_item_id')
            .exec(function (err, order) {
                order.items.forEach((item) => {
                    let subItems = [];
                    if (item.sub_items.length) {
                        subItems = item.sub_items.map((sub_item) => {
                            return {
                                ...sub_item.sub_item_id._doc,
                                count: sub_item.quantity,
                            };
                        });
                    }
                    items.push({
                        ...item.item_id._doc,
                        count: item.quantity,
                        items: subItems,
                    });
                });
                // update products quantities
                items.forEach((item) => {
                    if (item.items.length) {
                        item.items.forEach((subItem) => {
                            Product.findById(subItem._id).then((product) => {
                                product.quantity += subItem.count;
                                product.sold -= subItem.count;
                                product.save();
                            });
                        });
                    }
                    Product.findById(item._id).then((product) => {
                        product.quantity += item.count;
                        product.sold -= item.count;
                        product.save();
                    });
                });
                Order.findOneAndDelete({ _id: code }, (err, result) => {
                    if (result) {
                        if (!err) {
                            res.send({
                                message: 'order was deleted successfully',
                                items: items,
                            });
                        } else {
                            res.status(500).send(err);
                        }
                    } else {
                        next(errorHandler('Not authorized!', 405));
                    }
                });
            });
    };
    if (req.user.authority === 2) {
        handleValidateOTP(OTP, req.user._id)
            .then((valid) => {
                if (valid) {
                    Code.findOne({
                        code: OTP,
                    }).then((code) => {
                        code.count -= 1;
                        code.is_active = false;
                        code.save();
                    });
                    handleOrder();
                } else {
                    next(errorHandler('Invalid OTP', 405));
                }
            })
            .catch((err) => {
                res.status(500).send(err);
            });
    } else {
        handleOrder();
    }
};
exports.updateOrder = (req, res, next) => {
    const order_id = req.params.code;
    const { order_status, OTP } = req.body;
    const authority = req.user.authority;
    const update = () => {
        Order.findOneAndUpdate({ _id: order_id }, { status: order_status })
            .populate('user_id')
            .exec((err, result) => {
                if (result) {
                    if (!err) {
                        if (
                            order_status === 'out for delivery' ||
                            order_status === 'delivered'
                        ) {
                            sendEmail(
                                result.user_id.email,
                                order_status === 'delivered'
                                    ? 'Delivered'
                                    : 'Out for delivery',
                                'd-d8bc445965b24d1689bed4ac44a1a5fd',
                                {
                                    subject:
                                        order_status === 'delivered'
                                            ? 'Delivered'
                                            : 'Out for delivery',
                                    title:
                                        order_status === 'delivered'
                                            ? 'Delivered'
                                            : 'Out for delivery',
                                    text:
                                        order_status === 'delivered'
                                            ? 'Your order has been delivered successfully, thank you for shopping with us, it has been our pleasure.'
                                            : "Please be noted that your order is on it's way to your address, thank you for your trust.",
                                    order_no: result.order_id,
                                }
                            );
                        }
                        Code.findOneAndUpdate(
                            { code: OTP },
                            { is_active: false },
                            (err, result) => {}
                        );
                        res.send('Order updated successfully');
                    } else {
                        res.status(500).send(err);
                    }
                } else {
                    next(errorHandler('Not authorized!', 405));
                }
            });
    };
    handleValidateOTP(OTP, req.user._id)
        .then((result) => {
            if (authority === 1) {
                update();
            } else {
                if (
                    order_status === 'out for delivery' ||
                    order_status === 'delivered'
                ) {
                    update();
                } else {
                    if (result) {
                        update();
                    } else {
                        next(errorHandler('Invalid OTP', 405));
                    }
                }
            }
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};

exports.getCodes = (req, res, next) => {
    const { page } = req.query;
    Code.find()
        .count()
        .then((total) => {
            Code.find()
                .skip((page - 1) * 20)
                .limit(20)
                .sort({ createdAt: -1 })
                .then((codes) => {
                    res.send({ docs: codes, total: total });
                })
                .catch((err) => {
                    res.status(500).send(err);
                });
        });
};
exports.updateCodes = (req, res, next) => {
    const { code } = req.params;
    const { is_active } = req.body;
    Code.findOneAndUpdate(
        { code: code },
        { is_active: is_active },
        (err, result) => {
            if (result) {
                if (!err) {
                    res.send('Code was updated successfully');
                } else {
                    res.status(500).send(err);
                }
            } else {
                next(errorHandler('Not authorized!', 405));
            }
        }
    );
};
exports.createCodes = (req, res, next) => {
    const { no_of_codes, no_of_usage, percentage, max_discount } = req.body;
    let createdCodes = [];
    for (let i = 0; i < no_of_codes; i++) {
        crypto.randomBytes(3, (err, buf) => {
            if (!err) {
                let code = buf.toString('hex');
                let newCode = new Code({
                    code: code,
                    percentage: percentage,
                    max_discount: max_discount,
                    count: no_of_usage,
                    is_active: true,
                });
                createdCodes.push(newCode);
                newCode.save().then(() => {
                    if (i === no_of_codes - 1) {
                        res.send({
                            message: 'Codes has been created successfully',
                            codes: createdCodes,
                        });
                    }
                });
            }
        });
    }
};

exports.createOrder = (req, res, next) => {
    const { pos, OTP } = req.body;
    checkInStock(pos)
        .then(() => {
            let orderItems = getItems(pos);
            handleValidateOTP(OTP, req.user._id)
                .then((codeValid) => {
                    let posDiscount = 0;
                    if (codeValid) {
                        posDiscount =
                            orderItems.total * (codeValid.percentage / 100);
                    }
                    let newOrder = new Order({
                        order_id: 'sh' + Date.now(),
                        items: orderItems.list,
                        status: 'completed',
                        sub_total: orderItems.total,
                        discount: posDiscount,
                        total: Math.floor(orderItems.total - posDiscount),
                        order_type: 'shop',
                        user_id: req.user._id,
                    });
                    newOrder.save().then(() => {
                        updateProducts(orderItems.list, null, null)
                            .then(() => {
                                const response = () => {
                                    res.send(
                                        'Ordered has been submitted successfully'
                                    );
                                };
                                if (codeValid) {
                                    Code.findOneAndUpdate(
                                        { code: OTP },
                                        { is_active: false },
                                        (err, result) => {
                                            response();
                                        }
                                    );
                                } else {
                                    response();
                                }
                            })
                            .catch((err) => {
                                next(errorHandler(err.message, 405));
                            });
                    });
                })
                .catch((err) => {
                    res.status(500).send(err);
                });
        })
        .catch((err) => {
            if (err.type === 'stock') {
                res.status(405).send({
                    message: 'Out of stock',
                    data: err.data,
                });
            }
        });
};
const handleValidateOTP = (code, userID) => {
    if (code) {
        return Code.findOne({
            code: code,
            is_active: true,
            count: { $gt: 0 },
            users: { $nin: [userID] },
        });
    } else {
        return new Promise((resolve) => {
            resolve(null);
        });
    }
};
exports.validateOTP = (req, res, next) => {
    let code = req.params.code;
    handleValidateOTP(code, req.user._id)
        .then((result) => {
            if (result) {
                res.json({ percentage: result.percentage, code: result.code });
            } else {
                next(errorHandler('Invalid code', 405));
            }
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
exports.requestOTP = (req, res, next) => {
    let { percentage } = req.body;
    let newCode = new Code({
        code: (Math.random() * 10000 + 1000).toFixed(0),
        percentage: percentage,
        max_discount: 0,
        count: 1,
        code_type: 'shop',
        is_active: true,
    });
    newCode.save().then(() => {
        res.send('OTP has been created successfully');
    });
};
