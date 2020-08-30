const express = require('express');
const route = express.Router();
const User = require('../models/user_model');
const userController = require('../controllers/user_controller');

route.get('/', userController.getUser);
route.put('/update', userController.updateProfile);
route.post('/address', userController.addAdress);
route.put('/address/:code', userController.updateAddress);
route.delete('/address/:code', userController.deleteAddress);
route.post('/verifyEmail', userController.requestEmailVerification);
route.get('/orders', userController.getOrders);
route.put('/order', userController.cancelOrder);
route.get('/mixBox', userController.getMixBox);
route.get('/luxuryBox', userController.getLuxuryBox);
module.exports = route;
