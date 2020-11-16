const express = require('express');
const route = express.Router();
const admincontroller = require('../controllers/admin_controller');
const isAdmin = require('../middlewares/is_admin');
const isEmployee_Admin = require('../middlewares/is_employee-admin');

// admin
route.get('/products', isAdmin, admincontroller.getProducts);
route.post('/product', isAdmin, admincontroller.createProduct);
route.post('/product/image', isAdmin, admincontroller.uploadProductImage);
route.put('/product/:code', isAdmin, admincontroller.updateProduct);
route.delete('/product/:code', isAdmin, admincontroller.toggleDeleteProduct);
//codes
route.get('/codes', isAdmin, admincontroller.getCodes);
route.post('/codes', isAdmin, admincontroller.createCodes);

// employee
route.get('/orders', isEmployee_Admin, admincontroller.getOrders);
route.put('/order/:code', isEmployee_Admin, admincontroller.updateOrder);
route.post('/pos', isEmployee_Admin, admincontroller.createOrder);
route.post('/OTP', isEmployee_Admin, admincontroller.requestOTP);
route.post('/validateOTP/:code', isEmployee_Admin, admincontroller.validateOTP);
module.exports = route;
