const User = require('../models/user_model');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const validator = require('validator');
const errorHandler = require('../utils/errorHandler');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.login = (req, res, next) => {
    const { email, password } = req.body;
    const isEmailValid = validator.isEmail(email);
    if (isEmailValid) {
        User.findOne({ email: email })
            .then((user) => {
                if (!user) {
                    next({
                        statusCode: 404,
                        message: 'user not found',
                    });
                } else {
                    bcryptjs
                        .compare(password, user.password)
                        .then((match) => {
                            if (match) {
                                let userObj = user.toObject();
                                delete userObj.password;
                                jwt.sign(
                                    userObj,
                                    process.env.JWT_SECRET,
                                    function (err, token) {
                                        res.send({
                                            user: userObj,
                                            token: token,
                                        });
                                    }
                                );
                            } else {
                                res.status(405).send({
                                    message: 'Invalid email or password!',
                                });
                            }
                        })
                        .catch((err) => {
                            res.status(500).send(err);
                        });
                }
            })
            .catch((err) => {
                next(err);
            });
    } else {
        next(errorHandler('Invalid Email', 405));
    }
};
exports.signup = (req, res, next) => {
    const { name, email, password } = req.body;
    const isEmailValid = validator.isEmail(email);
    if (isEmailValid) {
        User.findOne({ email: email }).then((user) => {
            if (user) {
                res.status(405).json({ message: 'Email already exists!' });
            } else {
                bcryptjs
                    .hash(password, 12)
                    .then((hashedPassword) => {
                        const newUser = new User({
                            name: name,
                            email: email,
                            password: hashedPassword,
                        });
                        newUser
                            .save()
                            .then((user) => {
                                let userObj = user.toObject();
                                delete userObj.password;
                                jwt.sign(
                                    userObj,
                                    process.env.JWT_SECRET,
                                    function (err, token) {
                                        res.send({
                                            user: userObj,
                                            token: token,
                                        });
                                    }
                                );
                            })
                            .catch((err) => {
                                res.status(500).send(err);
                            });
                    })
                    .catch((err) => res.status(500).send(err));
            }
        });
    } else {
        next(errorHandler('Invalid Email', 405));
    }
};
exports.resetPassword = (req, res, next) => {
    const { email } = req.body;
    const isEmailValid = validator.isEmail(email);
    if (!isEmailValid) {
        next(errorHandler('Invalid Email', 405));
    } else {
        User.findOne({ email: email }).then((user) => {
            if (user) {
                if (user.email_verified) {
                    crypto.randomBytes(32, (err, buf) => {
                        if (!err) {
                            const token = buf.toString('hex');
                            user.resetToken = token;
                            user.resetTokenExp = Date.now() + 3600000;
                            user.save()
                                .then((result) => {
                                    const msg = {
                                        to: email,
                                        from: 'obada_567@hotmail.co.uk',
                                        subject: 'Resetting password',
                                        template_id:
                                            'd-5ce505e731334bafa92cc6da51321334',
                                        dynamic_template_data: {
                                            forgot_password_link: `${process.env.FRONTEND_DOMAIN}/resetPassword?token=${token}`,
                                        },
                                    };
                                    sgMail
                                        .send(msg)
                                        .then(() => {
                                            res.send(
                                                'reset password email was successfully sent'
                                            );
                                        })
                                        .catch((err) => {
                                            res.status(500).send(err);
                                        });
                                })
                                .catch((err) => {
                                    res.status(500).send(err);
                                });
                        }
                    });
                } else {
                    next(
                        errorHandler(
                            'Please verify your email in order to reset password',
                            405
                        )
                    );
                }
            } else {
                next(errorHandler("Email doesn't exist.", 404));
            }
        });
    }
};
exports.updatePassword = (req, res, next) => {
    const { resetToken, newPassword } = req.body;
    User.findOne({ resetToken: resetToken, resetTokenExp: { $gt: Date.now() } })
        .then((user) => {
            if (user) {
                bcryptjs.hash(newPassword, 12).then((hashedPassword) => {
                    user.password = hashedPassword;
                    user.resetToken = null;
                    user.resetTokenExp = null;
                    user.save()
                        .then(() => {
                            res.send('Password has been updated successfully');
                        })
                        .catch((err) => {
                            res.status(500).send(err);
                        });
                });
            } else {
                next(errorHandler('Token has expired.', 405));
            }
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
exports.verifyEmail = (req, res, next) => {
    let token = req.params.code;
    User.findOne({
        verify_email_token: token,
        verify_email_token_exp: { $gt: Date.now() },
    })
        .then((user) => {
            if (user) {
                user.email_verified = true;
                user.verify_email_token = null;
                user.verify_email_token_exp = null;
                user.save()
                    .then(() => {
                        res.send('Email verified successfully');
                    })
                    .catch((err) => {
                        res.status(500).send(err);
                    });
            } else {
                next(errorHandler('Invalid token'));
            }
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
