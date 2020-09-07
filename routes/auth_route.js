const express = require('express');
const route = express.Router();
const authController = require('../controllers/auth_controller');

route.post('/login', authController.login);
route.post('/signUp', authController.signup);
route.post('/resetPassword', authController.resetPassword);
route.put('/resetPassword', authController.updatePassword);
route.put('/verifyEmail/:code', authController.verifyEmail);

module.exports = route;
