const express = require('express');
const route = express.Router();
const admincontroller = require('../controllers/admin_controller');
const isAdmin = require('../middlewares/is_admin');
const isEmployee_Admin = require('../middlewares/is_employee-admin');

// admin
route.post('/product', isAdmin, admincontroller.createProduct);
route.post('/product/image', isAdmin, admincontroller.uploadProductImage);
route.put('/product/:code', isAdmin, admincontroller.updateProduct);
route.delete('/product/:code', isAdmin, admincontroller.deleteProduct);
route.post('/codes', isAdmin, admincontroller.createCodes);

// employee
route.get('/orders', isEmployee_Admin, admincontroller.getOrders);
route.put('/order/:code', isEmployee_Admin, admincontroller.updateOrder);

module.exports = route;
