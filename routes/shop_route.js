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
route.put('/mixBox', shopController.updateMixBox);
route.post('/mixBox/cart', shopController.addMixBoxToCart);
route.put('/mixBox/limit', shopController.updateMixBoxLimit);
route.put('/mixBox/clear', shopController.clearMixBox);
// luxury box
route.post('/luxuryBox', shopController.addToLuxuryBox);
route.put('/luxuryBox', shopController.updateLuxuryBox);
route.put('/luxuryBox/settings', shopController.updateLuxuryBoxSettings);
route.put('/luxuryBox/clear', shopController.clearLuxuryBox);
module.exports = route;
