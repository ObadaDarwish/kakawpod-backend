const express = require('express');
const areaController = require('../controllers/area_controller');
const userController = require('../controllers/user_controller');
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});
router.get('/areas', areaController.getAreas);
router.post('/contact', userController.contact);

module.exports = router;
