var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        dropDups: true
    },
    phone: {
        type: Number,
    },
    password: {
        type: String,
        required: true
    },
    cart: {
        type: Array,
        default: []
    },
    authority: {
        type: Number,
        default: 0
    },
    email_verified: {
        type: Boolean,
        default: 0
    },
    phone_verified: {
        type: Boolean,
        default: 0
    },
    shipping_addresses: {
        type: Number,
        default: 0
    },
    resetToken: String,
    resetTokenExp: Number

}, {timestamps: true});

module.exports = mongoose.model('User', userSchema);
