const express = require('express');
const route = express.Router();
const User = require('../models/user_model');
const userController = require('../controllers/user_controller');

route.put('/update', userController.updateProfile);


module.exports = route;
