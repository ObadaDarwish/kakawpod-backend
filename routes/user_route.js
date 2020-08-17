const express = require('express');
const route = express.Router();
const User = require('../models/user_model');


route.get('/', (req, res, next) => {
    User.find().then(users => {
            res.send(users);
        }
    )
});


module.exports = route;
