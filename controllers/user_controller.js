const User = require('../models/user_model');
const Order = require('../models/order_model');
const errorHandler = require('../utils/errorHandler');
const bcryptjs = require('bcryptjs');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
let Address = require('../models/address_model');

exports.getUser = (req, res, next) => {
    const userID = req.user._id;
    Address.find({ user_id: userID })
        .then((addresses) => {
            const userObj = req.user.toObject();
            delete userObj.password;
            delete userObj.cart;
            userObj.addresses = addresses;
            res.json(userObj);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};

exports.updateProfile = (req, res, next) => {
    const { name, email, password } = req.body;
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
                    resolve();
                });

                Promise.all([updateEmail, updateName])
                    .then(() => {
                        user.save()
                            .then(() => {
                                res.send('profile updated successfully');
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
    Address.find({ user_id: userID })
        .then((users) => {
            if (users.length < 2) {
                let newAddress = new Address({ ...req.body, user_id: userID });
                newAddress
                    .save()
                    .then(() => {
                        return User.findById(userID);
                    })
                    .then((user) => {
                        user.shipping_addresses += 1;
                        return user.save();
                    })
                    .then(() => {
                        res.send('address was added successfully');
                    })
                    .catch((err) => {
                        res.status(500).send(err);
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
    Address.findOneAndUpdate(
        { _id: addressID, user_id: req.user._id },
        req.body,
        (err, result) => {
            if (result) {
                if (!err) {
                    res.send('address was successfully updated');
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
                        const msg = {
                            to: userEmail,
                            from: 'obada_567@hotmail.co.uk',
                            subject: 'Verify Email',
                            template_id: 'd-8d621f33192e456694b5573c8818dd41',
                            dynamic_template_data: {
                                verify_email_link: `${process.env.FRONTEND_DOMAIN}/verifyEmail/${token}`,
                            },
                        };
                        sgMail
                            .send(msg)
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
        .then((products) => {
            res.send(products.mix_box);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
