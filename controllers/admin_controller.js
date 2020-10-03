const Product = require('../models/product_model');
const Order = require('../models/order_model');
const Code = require('../models/code_model');
const moment = require('moment');
const crypto = require('crypto');
const errorHandler = require('../utils/errorHandler');

exports.createProduct = (req, res, next) => {
    let newProducts = new Product({ ...req.body, user_id: req.user._id });
    newProducts
        .save()
        .then(() => {
            res.send('product saved successfully');
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
                    res.send('Product was successfully updated');
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

exports.deleteProduct = (req, res, next) => {
    const productID = req.params.code;
    Product.findOneAndDelete(
        { _id: productID, user_id: req.user._id },
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
};

exports.getOrders = (req, res, next) => {
    // start_at timestamp  start of day
    // end_at timestamp end of day
    let currentDate = new Date().getTime() / 1000;
    let total = 0;
    const {
        status = 'pending',
        start_at = currentDate - 86400,
        end_at = currentDate,
        page = 1,
    } = req.query;

    const getObj = () => {
        findObj = {};
        findObj.status = status;
        findObj.createdAt = {
            $gte: moment.unix(start_at).format(),
            $lte: moment.unix(end_at).format(),
        };
        return findObj;
    };
    Order.find(getObj())
        .count()
        .then((totalOrders) => {
            total = totalOrders;
            Order.find(getObj())
                .sort({ createdAt: -1 })
                .populate([
                    {
                        path: 'items.item_id',
                        options: {
                            limit: 10,
                            skip: (page - 1) * 10,
                        },
                    },
                    {
                        path: 'items.sub_items.sub_item_id',
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

exports.updateOrder = (req, res, next) => {
    const order_id = req.params.code;
    const order_status = req.body.order_status;
    const authority = req.user.authority;
    const canUpdate = (authority) => {
        if (authority === 1) {
            return true;
        } else {
            if (
                order_status === 'out for delivery' ||
                order_status === 'delivered'
            ) {
                return true;
            } else {
                return false;
            }
        }
    };
    if (canUpdate(authority)) {
        Order.findOneAndUpdate(
            { _id: order_id },
            { status: order_status },
            (err, result) => {
                if (result) {
                    if (!err) {
                        res.send('Order updated successfully');
                    } else {
                        res.status(500).send(err);
                    }
                } else {
                    next(errorHandler('Not authorized!', 405));
                }
            }
        );
    } else {
        next(errorHandler('Not authorized!', 405));
    }
};

exports.createCodes = (req, res, next) => {
    const { no_of_codes, no_of_usage, percentage, max_discount } = req.body;
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
                newCode.save();
            }
        });
        if (i === no_of_codes - 1) {
            res.send('Codes has been created successfully');
        }
    }
};
