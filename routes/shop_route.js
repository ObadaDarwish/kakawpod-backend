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
// mix box
route.post('/mixBox', shopController.addToMixBox);
route.post('/mixBox/cart', shopController.addMixBoxToCart);
route.put('/mixBox', shopController.updateMixBox);
route.put('/mixBox/limit', shopController.updateMixBoxLimit);
route.put('/mixBox/clear', shopController.clearMixBox);

module.exports = route;
