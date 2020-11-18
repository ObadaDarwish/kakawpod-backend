const Product = require('../models/product_model');
const mongoose = require('mongoose');
const Code = require('../models/code_model');

exports.checkInStock = (cart) => {
    let cartProducts = [];
    let outOfStockProducts = [];
    const updateCartArray = (item) => {
        let isFound = cartProducts.findIndex(
            (product) => product._id.toString() === item._id.toString()
        );
        if (isFound === -1) {
            cartProducts.push({
                mongoId: mongoose.Types.ObjectId(item._id),
                _id: item._id,
                count: item.count,
            });
        } else {
            cartProducts[isFound].count += item.count;
        }
    };
    cart.forEach((item) => {
        updateCartArray(item);
        if (item.items && item.items.length) {
            item.items.forEach((sub_item) => {
                updateCartArray(sub_item);
            });
        }
    });

    const getProductCount = (id) => {
        let findProduct = cartProducts.findIndex(
            (item) => item._id === id.toString()
        );
        return cartProducts[findProduct].count;
    };
    let checkStockPromise = new Promise((resolve, reject) => {
        let cartProductMongoIds = cartProducts.map((item) => {
            return item.mongoId;
        });
        let cartItems = [...cart];
        Product.find({
            _id: { $in: cartProductMongoIds },
            is_deleted: false,
        }).then((products) => {
            products.forEach((product, index) => {
                let isFound = cartItems.findIndex(
                    (item) => item._id.toString() === product._id.toString()
                );
                if (isFound >= 0) {
                    cartItems[isFound].price = product.price;
                }
                if (product.quantity < getProductCount(product._id)) {
                    outOfStockProducts.push(product);
                    reject({ type: 'stock', data: outOfStockProducts });
                }
                if (products.length === index + 1) {
                    resolve(cartItems);
                }
            });
        });
    });
    return checkStockPromise;
};
exports.updateProducts = (orderItems, promoCodeObj, userId) => {
    let updateProducts = [];
    let updateProductsPromise = new Promise((resolve, reject) => {
        orderItems.forEach((item) => {
            let isItemFound = updateProducts.findIndex(
                (product) =>
                    product.item_id.toString() === item.item_id.toString()
            );
            if (isItemFound === -1) {
                updateProducts.push({
                    item_id: item.item_id,
                    quantity: item.quantity,
                });
            } else {
                updateProducts[isItemFound].quantity += item.quantity;
            }

            if (item.sub_items && item.sub_items.length) {
                item.sub_items.forEach((sub_item) => {
                    let isFound = updateProducts.findIndex(
                        (product) =>
                            product.item_id.toString() ===
                            sub_item.sub_item_id.toString()
                    );
                    if (isFound === -1) {
                        updateProducts.push({
                            item_id: sub_item.sub_item_id,
                            quantity: sub_item.quantity,
                        });
                    } else {
                        updateProducts[isFound].quantity += sub_item.quantity;
                    }
                });
            }
        });
        updateProducts.forEach((item, index) => {
            Product.findById(item.item_id).then((product) => {
                product.quantity -= item.quantity;
                product.sold += item.quantity;
                product.save();
            });
            if (updateProducts.length === index + 1) {
                resolve();
            }
        });
    });
    let updateCodePromise = new Promise((resolve, reject) => {
        if (promoCodeObj) {
            Code.findOne({
                code: promoCodeObj.code,
            }).then((code) => {
                let currentUsers = code.users;
                currentUsers.push(userId);
                code.users = currentUsers;
                code.count -= 1;
                if (!code.count) {
                    code.is_active = false;
                }
                code.save();
                resolve();
            });
        } else {
            resolve();
        }
    });
    return Promise.all([updateProductsPromise, updateCodePromise]);
};
exports.getItems = (items) => {
    let cartTotal = 0;
    let localItems = items.map((cartItem) => {
        let subItems = [];
        cartTotal +=
            (cartItem.category === 'luxuryBox'
                ? cartItem.total
                : cartItem.price) * cartItem.count;
        if (cartItem.items && cartItem.items.length) {
            subItems = [...cartItem.items].map((subItem) => {
                return {
                    sub_item_id: subItem._id,
                    quantity: subItem.count,
                };
            });
        }
        return {
            item_id: cartItem._id,
            sub_items: subItems,
            price:
                cartItem.category === 'luxuryBox'
                    ? cartItem.total
                    : cartItem.price,
            quantity: cartItem.count,
        };
    });

    return {
        list: localItems,
        total: cartTotal,
    };
};
