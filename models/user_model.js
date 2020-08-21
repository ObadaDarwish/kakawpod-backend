const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            dropDups: true,
        },
        phone: {
            type: Number,
        },
        password: {
            type: String,
            required: true,
        },
        cart: [
            {
                product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
                quantity: { type: Number, required: true },
            },
        ],
        authority: {
            type: Number,
            default: 0,
        },
        email_verified: {
            type: Boolean,
            default: 0,
        },
        phone_verified: {
            type: Boolean,
            default: 0,
        },
        shipping_addresses: {
            type: Number,
            default: 0,
        },
        resetToken: String,
        resetTokenExp: Number,
        verify_email_token: String,
        verify_email_token_exp: Number,
    },
    { timestamps: true }
);
userSchema.methods.addToCart = function (product) {
    let isProdFound =
        this.cart &&
        this.cart.findIndex(
            (cartItem) =>
                cartItem.product_id.toString() === product._id.toString()
        );
    let newQuantity = 1;
    const updatedCartItems = [...this.cart];
    if (isProdFound >= 0) {
        newQuantity = this.cart[isProdFound].quantity + 1;
        if (newQuantity <= product.quantity) {
            updatedCartItems[isProdFound].quantity = newQuantity;
        } else {
            throw new Error('product is out of stock');
        }
    } else {
        updatedCartItems.push({
            product_id: product._id,
            quantity: newQuantity,
        });
    }
    this.cart = updatedCartItems;
    return this.save();
};
userSchema.methods.removeFromCart = function (itemId) {
    const updatedCart = [...this.cart].filter(
        (item) => item._id.toString() !== itemId.toString()
    );
    this.cart = updatedCart;
    return this.save();
};
userSchema.methods.clearCart = function () {
    this.cart = [];
    return this.save();
};
userSchema.methods.updateCart = function (itemId, quantity) {
    if (quantity > 0) {
        let currentCart = [...this.cart];
        let itemIndex = currentCart.findIndex(
            (item) => item._id.toString() === itemId.toString()
        );
        let updatedItem = currentCart[itemIndex];
        updatedItem.quantity = quantity;
        currentCart.splice(itemIndex, 1, updatedItem);
        this.cart = currentCart;
        return this.save();
    } else {
        throw new Error('quantity must be at least 1');
    }
};
module.exports = mongoose.model('User', userSchema);
