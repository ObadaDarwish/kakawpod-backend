const createError = require('http-errors');
const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const multer = require('./middlewares/upload-image');
const morgan = require('morgan');
const morganHelper = require('./utils/morganHelper');
const fs = require('fs');
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth_route');
const userRoute = require('./routes/user_route');
const adminRoute = require('./routes/admin_route');
const shopRoute = require('./routes/shop_route');
const productRoute = require('./routes/product_route');
const isAuth = require('./middlewares/is_auth.js');

// CORS headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type',
        'Authorization'
    );
    next();
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(morgan('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(multer);
// logs
app.use(morganHelper);
// routes
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/product', productRoute);
app.use('/user', isAuth, userRoute);
app.use('/shop', isAuth, shopRoute);
app.use('/admin', isAuth, adminRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    console.log('global error handler');
    res.status(err.statusCode).send({ message: err.message });
});

module.exports = app;
