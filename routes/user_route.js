const express = require('express');
const route = express.Router();
const User = require('../models/user_model');
const userController = require('../controllers/user_controller');

route.get('/', userController.getUser)
route.put('/update', userController.updateProfile);
route.post('/address', userController.addAdress);
route.put('/address/:code', userController.updateAddress);
route.delete('/address/:code', userController.deleteAddress);
route.post('/verifyEmail', userController.requestEmailVerification);

module.exports = route;
