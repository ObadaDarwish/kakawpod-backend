const express = require('express');
const route = express.Router();
const productController = require('../controllers/product_controller');

route.get('/', productController.getAllProduct);
route.get('/:code', productController.getProduct);

module.exports = route;
