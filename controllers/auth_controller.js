const User = require('../models/user_model');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
exports.login = (req, res, next) => {

    const {email, password} = req.body;
    User.findOne({email: email}).then(user => {
        if (!user) {
            next({
                statusCode: 404,
                message: 'user not found'
            })
        } else {
            bcryptjs.compare(password, user.password).then((match) => {
                if (match) {
                    let userObj = user.toObject();
                    delete userObj.password;
                    jwt.sign(userObj, process.env.JWT_SECRET, function (err, token) {
                        res.send({user: userObj, token: token});
                    });
                } else {
                    res.status(405).send({message: 'Invalid email or password!'});
                }
            }).catch(err => {
                res.status(500).send(err)
            });
        }
    }).catch(err => {
        next(err);
    })

};
exports.signup = (req, res, next) => {
    const {name, email, password} = req.body;
    User.findOne({email: email}).then(user => {
        if (user) {
            res.status(405).json({message: 'Email already exists!'})
        } else {
            bcryptjs.hash(password, 12).then(hashedPassword => {
                const newUser = new User({name: name, email: email, password: hashedPassword});
                newUser.save().then(() => {
                    res.json({message: 'User created successfully'})
                }).catch(err => {
                    res.status(500).send(err);
                });
            }).catch(err => res.status(500).send(err))
        }
    })
};
