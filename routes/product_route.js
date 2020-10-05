const express = require('express');
const route = express.Router();
const productController = require('../controllers/product_controller');

route.get('/all', productController.getAllProduct);
route.get('/topSelling', productController.getTopSellingProducts);
route.get('/:code', productController.getProduct);

module.exports = route;
