const User = require('../models/user_model');
const errorHandler = require('../utils/errorHandler');
const bcryptjs = require('bcryptjs');


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
