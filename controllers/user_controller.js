const User = require('../models/user_model');
const errorHandler = require('../utils/errorHandler');
const bcryptjs = require('bcryptjs');
let Address = require('../models/address_model');


exports.getUser = (req, res, next) => {
    const userID = req.user._id;
    User.findById(userID).then(user => {
        let userObj = user.toObject();
        delete userObj.password
        res.json(userObj)
    }).catch(err => {
        res.status(500).send(err);
    })
};

exports.updateProfile = (req, res, next) => {
    const {name, email, password} = req.body;
    User.findById(req.user._id).then(user => {
        if (user) {
            const updateEmail = new Promise((resolve, reject) => {
                if (email && email !== user.email) {
                    if (password) {
                        bcryptjs.compare(password, user.password).then((match) => {
                            if (match) {
                                user.email = email;
                                resolve()
                            } else {
                                next(errorHandler('Password does not match', 405));
                                reject('Password does not match')
                            }
                        }).catch(err => {
                            res.status(500).send(err)
                        })
                    } else {
                        reject('password is required to update email')
                    }
                } else {
                    resolve();
                }
            });
            const updateName = new Promise((resolve, reject) => {
                if (name !== user.name) {
                    user.name = name;
                }
                resolve()
            });

            Promise.all([updateEmail, updateName]).then(() => {
                user.save().then(() => {
                    res.send('profile updated successfully');
                }).catch(err => {
                    res.status(500).send(err)
                });
            }).catch((err) => {
                next(errorHandler(err, 405))
            })


        } else {
            next(errorHandler('User does not exist', 405));
        }
    }).catch(err => {
        res.status(500).send(err)
    })
}

exports.addAdress = (req, res, next) => {
    const userID = req.user._id
    Address.find({user_id: userID}).then(users => {
        if (users.length < 2) {
            let newAddress = new Address({...req.body, user_id: userID});
            newAddress.save().then(() => {
                return User.findById(userID);
            }).then((user) => {
                user.shipping_addresses += 1;
                return user.save();
            }).then(() => {
                res.send('address was added successfully');
            }).catch(err => {
                res.status(500).send(err)
            })
        } else {
            next(errorHandler('only two addresses are allowed per user', 405));
        }
    }).catch(err => {
        res.status(500).send(err)
    })
};

exports.updateAddress = (req, res, next) => {
    const addressID = req.params.code;
    Address.findOneAndUpdate({_id: addressID, user_id: req.user._id}, req.body, (err, result) => {
        if (result) {
            if (!err) {
                res.send('address was successfully updated')
            } else {
                res.status(500).send(err)
            }
        } else {
            next(errorHandler('Not authorized!', 405))
        }

    }).catch(err => {
        res.status(500).send(err)
    })
};
exports.deleteAddress = (req, res, next) => {
    const addressID = req.params.code;
    Address.findOneAndDelete({_id: addressID, user_id: req.user._id}, (err, result) => {
        if (result) {
            if (!err) {
                res.send('address was successfully deleted')
            } else {
                res.status(500).send(err)
            }
        } else {
            next(errorHandler('Not authorized!', 405))
        }
    }).catch(err => {
        res.status(500).send(err)
    })
}
