const express = require('express');
const route = express.Router();
const admincontroller = require('../controllers/admin_controller');
const isAdmin = require('../middlewares/is_admin');
const isEmployee_Admin = require('../middlewares/is_employee-admin');

// admin

route.get('/products', isAdmin, admincontroller.getProducts);
route.post('/product', isAdmin, admincontroller.createProduct);
route.get('/products/all', isAdmin, admincontroller.getAllProducts);
route.post('/product/image', isAdmin, admincontroller.uploadProductImage);
route.put('/product/:code', isAdmin, admincontroller.updateProduct);
route.delete('/product/:code', isAdmin, admincontroller.toggleDeleteProduct);
//codes
route.get('/codes', isAdmin, admincontroller.getCodes);
route.put('/codes/:code', isAdmin, admincontroller.updateCodes);
route.post('/codes', isAdmin, admincontroller.createCodes);

// employee
route.get('/orders', isEmployee_Admin, admincontroller.getOrders);
route.put(
    '/completedOrder/:code',
    isEmployee_Admin,
    admincontroller.updateCompletedOrder
);
route.put('/order/:code', isEmployee_Admin, admincontroller.updateOrder);
route.post('/pos', isEmployee_Admin, admincontroller.createOrder);
route.post('/OTP', isEmployee_Admin, admincontroller.requestOTP);
route.post('/validateOTP/:code', isEmployee_Admin, admincontroller.validateOTP);
// stats

route.get('/stats/daily', isAdmin, admincontroller.getDailyStats);
route.get('/stats/monthly', isAdmin, admincontroller.getMonthlyStats);
route.get('/stats/orders', isAdmin, admincontroller.getOrderPercentage);
route.get('/stats/general', isAdmin, admincontroller.getGeneralStats);

module.exports = route;
