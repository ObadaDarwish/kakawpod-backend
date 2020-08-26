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
        mix_box: {
            items: [
                {
                    product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
                    quantity: { type: Number, required: true },
                },
            ],
            limit: { type: Number, default: 3 },
        },
        resetToken: String,
        resetTokenExp: Number,
        verify_email_token: String,
        verify_email_token_exp: Number,
    },
    { timestamps: true }
);
userSchema.methods.addToCart = function (product) {
    this.cart = addItem(product, this.cart);
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

function addItem(product, collection) {
    let isProdFound =
        collection &&
        collection.findIndex(
            (item) => item.product_id.toString() === product._id.toString()
        );
    let newQuantity = 1;
    const updatedItems = [...collection];
    if (isProdFound >= 0) {
        newQuantity = collection[isProdFound].quantity + 1;
        if (newQuantity <= product.quantity) {
            updatedItems[isProdFound].quantity = newQuantity;
        } else {
            throw new Error('product is out of stock');
        }
    } else {
        updatedItems.push({
            product_id: product._id,
            quantity: newQuantity,
        });
    }
    return updatedItems;
}

function getMixBoxCount(box) {
    let count = 0;
    box.forEach((item) => {
        count += item.quantity;
    });
    return count;
}

userSchema.methods.addToMixBox = function (product) {
    if (getMixBoxCount(this.mix_box.items) < this.mix_box.limit) {
        this.mix_box.items = addItem(product, this.mix_box.items);
        return this.save();
    } else {
        throw new Error(
            `You can only add ${this.mix_box.limit} bars in the box`
        );
    }
};
userSchema.methods.updateMixBox = function (product_id, qunatity) {
    let box = [...this.mix_box.items];
    let isProductFound = box.findIndex(
        (item) => item.product_id.toString() === product_id.toString()
    );
    if (isProductFound !== -1) {
        box[isProductFound].quantity = qunatity;
    } else {
        throw new Error(`Product not found`);
    }
    let count = getMixBoxCount(box);
    if (count <= this.mix_box.limit) {
        this.mix_box.items = box;
        return this.save();
    } else {
        throw new Error(
            `You can only add ${this.mix_box.limit} bars in the box`
        );
    }
};
module.exports = mongoose.model('User', userSchema);
