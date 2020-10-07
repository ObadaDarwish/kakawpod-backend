const User = require('../models/user_model');
const Order = require('../models/order_model');
const Area = require('../models/area_model');
const Product = require('../models/product_model');
const errorHandler = require('../utils/errorHandler');
const bcryptjs = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const { filterUser } = require('../utils/user');
let Address = require('../models/address_model');

exports.getUser = (req, res, next) => {
    const userID = req.user._id;
    Address.find({ user_id: userID })
        .populate('delivery_fees_id')
        .exec(function (err, addresses) {
            if (err) {
                res.status(500).send(err);
            } else {
                const userObj = filterUser(req.user);
                userObj.addresses = addresses;
                res.json(userObj);
            }
        });
};

exports.updateProfile = (req, res, next) => {
    const { name, email, password, phone } = req.body;
    User.findById(req.user._id)
        .then((user) => {
            if (user) {
                const updateEmail = new Promise((resolve, reject) => {
                    if (email && email !== user.email) {
                        if (password) {
                            bcryptjs
                                .compare(password, user.password)
                                .then((match) => {
                                    if (match) {
                                        user.email = email;
                                        user.email_verified = false;
                                        resolve();
                                    } else {
                                        next(
                                            errorHandler(
                                                'Password does not match',
                                                405
                                            )
                                        );
                                        reject('Password does not match');
                                    }
                                })
                                .catch((err) => {
                                    res.status(500).send(err);
                                });
                        } else {
                            reject('password is required to update email');
                        }
                    } else {
                        resolve();
                    }
                });
                const updateName = new Promise((resolve, reject) => {
                    if (name !== user.name) {
                        user.name = name;
                    }
                    if (phone !== user.phone) {
                        user.phone = phone;
                        user.phone_verified = false;
                    }
                    resolve();
                });

                Promise.all([updateEmail, updateName])
                    .then(() => {
                        user.save()
                            .then(() => {
                                let userObj = filterUser(user);
                                res.send(userObj);
                            })
                            .catch((err) => {
                                res.status(500).send(err);
                            });
                    })
                    .catch((err) => {
                        next(errorHandler(err, 405));
                    });
            } else {
                next(errorHandler('User does not exist', 405));
            }
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};

exports.addAdress = (req, res, next) => {
    const userID = req.user._id;
    let newAddressId = '';
    Address.find({ user_id: userID })
        .then((addresses) => {
            if (addresses.length < 2) {
                Area.findOne({ area: req.body.area }).then((area) => {
                    if (area) {
                        let newAddress = new Address({
                            ...req.body,
                            delivery_fees_id: area._id,
                            user_id: userID,
                            primary: addresses.length === 0,
                        });
                        newAddress
                            .save()
                            .then((address) => {
                                newAddressId = address._id;
                                return User.findById(userID);
                            })
                            .then((user) => {
                                user.shipping_addresses += 1;
                                return user.save();
                            })
                            .then(() => {
                                res.send({
                                    message: 'address was added successfully',
                                    address_id: newAddressId,
                                    area: area,
                                });
                            })
                            .catch((err) => {
                                res.status(500).send(err);
                            });
                    } else {
                        next(errorHandler('Area not supported', 405));
                    }
                });
            } else {
                next(
                    errorHandler('only two addresses are allowed per user', 405)
                );
            }
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};

exports.updateAddress = (req, res, next) => {
    const addressID = req.params.code;
    Address.find({ user_id: req.user._id }).then((addresses) => {
        if (addresses.length) {
            addresses.forEach((address, index) => {
                if (address._id.toString() !== addressID.toString()) {
                    Address.findOneAndUpdate(
                        { _id: address._id, user_id: req.user._id },
                        { primary: !req.body.primary },
                        (err, result) => {}
                    );
                } else {
                    Address.findOneAndUpdate(
                        { _id: addressID, user_id: req.user._id },
                        req.body,
                        (err, result) => {
                            if (result) {
                                if (!err) {
                                    res.send(
                                        'address was successfully updated'
                                    );
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
                }
            });
        } else {
            next(errorHandler('No address records were found!', 405));
        }
    });
};
exports.deleteAddress = (req, res, next) => {
    const addressID = req.params.code;
    const userID = req.user._id;
    Address.findOneAndDelete(
        { _id: addressID, user_id: userID },
        (err, result) => {
            if (result) {
                if (!err) {
                    User.findById(userID).then((user) => {
                        if (user.shipping_addresses > 0) {
                            user.shipping_addresses -= 1;
                            user.save()
                                .then(() => {
                                    res.send(
                                        'address was successfully deleted'
                                    );
                                })
                                .catch((err) => {
                                    res.status(500).send(err);
                                });
                        }
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

exports.requestEmailVerification = (req, res, next) => {
    const userID = req.user._id;
    const userEmail = req.user.email;
    User.findById(userID)
        .then((user) => {
            crypto.randomBytes(32, (err, buf) => {
                if (!err) {
                    let token = buf.toString('hex');
                    user.verify_email_token = token;
                    user.verify_email_token_exp = Date.now() + 3600000;
                    user.save().then(() => {
                        sendEmail(
                            userEmail,
                            'Verify Email',
                            'd-8d621f33192e456694b5573c8818dd41',
                            {
                                verify_email_link: `${process.env.FRONTEND_DOMAIN}/verifyEmail?token=${token}`,
                            }
                        )
                            .then(() => {
                                res.send('Verify email was successfully sent');
                            })
                            .catch((err) => {
                                res.status(500).send(err);
                            });
                    });
                }
            });
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
exports.requestPhoneVerification = (req, res, next) => {
    const userID = req.user._id;
    const { phone } = req.body;
    User.findById(userID)
        .then((user) => {
            if (user) {
                if (
                    (user.phone_verification_count < 3 &&
                        user.phone_verification_can_update_at >= Date.now()) ||
                    !user.phone_verification_count
                ) {
                    user.phone = phone;
                    user.verify_phone_code = Math.floor(
                        Math.random() * 1000000
                    );
                    user.verify_phone_code_exp = Date.now() + 3600000;
                    user.phone_verification_count += 1;
                    user.phone_verification_can_update_at =
                        Date.now() + 86400000;
                    user.save().then(() => {
                        res.send('phone verification code generated');
                    });
                } else {
                    next(
                        errorHandler(
                            'reached max limit, please wait 24 hours before trying again',
                            405
                        )
                    );
                }
            }
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
exports.PhoneVerification = (req, res, next) => {
    const userID = req.user._id;
    const { code } = req.body;
    User.findOne({
        _id: userID,
        verify_phone_code: code,
        verify_phone_code_exp: { $gt: Date.now() },
    })
        .then((user) => {
            if (user) {
                user.phone_verified = true;
                user.verify_phone_code = null;
                user.verify_phone_code_exp = null;
                user.phone_verification_count = 0;
                user.phone_verification_can_update_at = null;
                user.save().then(() => {
                    res.send('phone verified successfully');
                });
            } else {
                next(errorHandler('Invalid or expired code', 405));
            }
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
exports.getOrders = (req, res, next) => {
    const { page = 1 } = req.query;
    let total = 0;
    Order.find({ user_id: req.user._id })
        .count()
        .then((count) => {
            total = count;
            Order.find({ user_id: req.user._id })
                .sort({ createdAt: -1 })
                .skip((page - 1) * 10)
                .limit(10)
                .populate('items.item_id')
                .populate('items.sub_items.sub_item_id')
                .populate('address_id')
                .exec(function (err, orders) {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.send({ orders: orders, total: total });
                    }
                });
        });
};
exports.cancelOrder = (req, res, next) => {
    const { order_id, order_status } = req.body;
    Order.findOneAndUpdate(
        { _id: order_id, user_id: req.user._id, status: 'pending' },
        { status: 'cancelled' },
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
};
exports.getMixBox = (req, res, next) => {
    req.user
        .populate('mix_box.items.product_id')
        .execPopulate()
        .then((user) => {
            const { box_id } = user.mix_box;
            if (!box_id) {
                Product.findOne({
                    name: '3 bars',
                    category: 'mixBox',
                })
                    .then((box) => {
                        if (box) {
                            user.mix_box.limit = 3;
                            user.mix_box.box_id = box._id;
                            user.mix_box.box_name = box.name;
                            user.mix_box.box_price = box.price;
                            user.save().then(() => {
                                res.send(user.mix_box);
                            });
                        } else {
                            res.send(user.mix_box);
                        }
                    })
                    .catch((err) => {
                        res.status(500).send(err);
                    });
            } else {
                res.send(user.mix_box);
            }
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
exports.getLuxuryBox = (req, res, next) => {
    req.user
        .populate('luxury_box.items.product_id')
        .populate('luxury_box.box_id')
        .populate('luxury_box.box_packaging')
        .execPopulate()
        .then((products) => {
            res.send(products.luxury_box);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
