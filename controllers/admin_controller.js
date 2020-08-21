const Product = require('../models/product_model');
const errorHandler = require('../utils/errorHandler');


exports.createProduct = (req, res, next) => {
    let newProducts = new Product({...req.body, user_id: req.user._id});
    newProducts.save().then(() => {
        res.send('product saved successfully');
    }).catch(err => {
        res.status(500).send(err)
    })
};

exports.uploadProductImage = (req, res, next) => {
    const file = req.file;
    if (!file) {
        let error = new Error();
        error = {...error, statusCode: 403, message: 'file type is not supported'};
        throw error;
    } else {
        res.json({
            message: 'image uploaded successfully',
            images: file.images
        })
    }
};


exports.updateProduct = (req, res, next) => {
    const productID = req.params.code;
    Product.findOneAndUpdate({_id: productID, user_id: req.user._id}, req.body, (err, result) => {
        if (result) {
            if (!err) {
                res.send('Product was successfully updated')
            } else {
                res.status(500).send(err)
            }
        } else {
            next(errorHandler('Not authorized!', 405))
        }
    }).catch(err => {
        res.status(500).send(err)
    })
}

exports.deleteProduct = (req, res, next) => {
    const productID = req.params.code;
    Product.findOneAndDelete({_id: productID, user_id: req.user._id}, (err, result) => {
        if (result) {
            if (!err) {
                res.send('Product was deleted successfully')
            } else {
                res.status(500).send(err)
            }
        } else {
            next(errorHandler('Not authorized!', 405))
        }
    }).catch(err => {
        res.status(500).send(err)
    })
};
