const express = require('express');
const route = express.Router();
const shopController = require('../controllers/shop_controller');

route.post('/cart', shopController.addToCart);
route.delete('/cart/:code', shopController.removeFromCart);
route.delete('/cart', shopController.clearCart);
route.put('/cart/:code', shopController.updateCart);

module.exports = route;