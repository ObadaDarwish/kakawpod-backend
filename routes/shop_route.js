const express = require('express');
const route = express.Router();
const shopController = require('../controllers/shop_controller');

// cart
route.get('/cart', shopController.getMyCart);
route.post('/cart', shopController.addToCart);
route.delete('/cart/:code', shopController.removeFromCart);
route.delete('/cart', shopController.clearCart);
route.put('/cart/:code', shopController.updateCart);

// orders
route.post('/order', shopController.createOrder);

module.exports = route;
