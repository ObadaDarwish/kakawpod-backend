const express = require('express');
const route = express.Router();
const admincontroller = require('../controllers/admin_controller');


route.post('/product', admincontroller.createProduct);
route.post('/product/image',admincontroller.uploadProductImage);
route.put('/product/:code',admincontroller.updateProduct);
route.delete('/product/:code',admincontroller.deleteProduct);

module.exports = route;
