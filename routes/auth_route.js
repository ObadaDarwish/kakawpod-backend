const express = require('express');
const route = express.Router();
const authController = require('../controllers/auth_controller')

route.post('/login', authController.login);
route.post('/signup', authController.signup);

module.exports = route;
