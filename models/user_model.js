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
                items: [
                    {
                        product_id: {
                            type: Schema.Types.ObjectId,
                            ref: 'Product',
                        },
                        quantity: { type: Number, required: true },
                    },
                ],
                packaging_id: {
                    type: Schema.Types.ObjectId,
                    ref: 'Product',
                },
                quantity: { type: Number, required: true },
                type: { type: String, default: 'bar', required: true },
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
            box_id: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            },
            limit: { type: Number, default: 3 },
        },
        luxury_box: {
            box_id: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            },
            box_packaging: { type: Schema.Types.ObjectId, ref: 'Product' },
            weight: { type: Number, default: 500 },
            items: [
                {
                    product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
                    quantity: { type: Number, required: true },
                },
            ],
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
    let isProdFound = -1;
    if (collection.length) {
        isProdFound = collection.findIndex(
            (item) => item.product_id.toString() === product._id.toString()
        );
    }

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

function getMixBoxCount(items) {
    let count = 0;
    items.forEach((item) => {
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
userSchema.methods.updateMixBoxLimit = function (box_id, limit) {
    this.mix_box.box_id = box_id;
    this.mix_box.limit = limit;
    return this.save();
};
userSchema.methods.addMixBoxToCart = function () {
    let items = [...this.mix_box.items].map((item) => {
        return {
            product_id: item.product_id,
            quantity: item.quantity,
        };
    });
    let count = 0;
    items.forEach((item) => {
        count += item.quantity;
    });
    if (this.mix_box.limit === count) {
        this.cart.push({
            product_id: this.mix_box.box_id,
            items: items,
            quantity: 1,
            type: 'mix box',
        });
        return this.save();
    } else {
        throw new Error(`Mix box is not full`);
    }
};
userSchema.methods.clearMixBox = function () {
    this.mix_box.items = [];
    return this.save();
};

function getItemsWeightLuxuryBox(items) {
    let weight = 0;
    items.forEach((item) => {
        weight += item.quantity * 10;
    });
    return weight;
}

userSchema.methods.addToLuxuryBox = function (product) {
    if (
        getItemsWeightLuxuryBox(this.luxury_box.items) < this.luxury_box.weight
    ) {
        this.luxury_box.items = addItem(product, this.luxury_box.items);
        return this.save();
    } else {
        throw new Error(
            `You can only add ${this.mix_box.limit} bars in the box`
        );
    }
};
userSchema.methods.updateLuxuryBoxSettings = function (product, packaging_id) {
    this.luxury_box.box_id = product._id;
    this.luxury_box.weight = product.weight;
    this.luxury_box.box_packaging = packaging_id;
    return this.save();
};
userSchema.methods.updateLuxuryBox = function (product_id, qunatity) {
    let box = [...this.luxury_box.items];
    let isProductFound = box.findIndex(
        (item) => item.product_id.toString() === product_id.toString()
    );
    if (isProductFound !== -1) {
        box[isProductFound].quantity = qunatity;
    } else {
        throw new Error(`Product not found`);
    }
    let count = getItemsWeightLuxuryBox(box);
    if (count <= this.luxury_box.weight) {
        this.luxury_box.items = box;
        return this.save();
    } else {
        throw new Error(
            `You can only add ${this.luxury_box.weight / 10} bars in the box`
        );
    }
};
userSchema.methods.clearLuxuryBox = function () {
    this.luxury_box.items = [];
    return this.save();
};
userSchema.methods.addLuxuryBoxToCart = function () {
    let items = [...this.luxury_box.items].map((item) => {
        return {
            product_id: item.product_id,
            quantity: item.quantity,
        };
    });
    let weight = 0;
    items.forEach((item) => {
        weight += item.quantity * 10;
    });
    if (this.luxury_box.weight === weight) {
        this.cart.push({
            product_id: this.luxury_box.box_id,
            packaging_id: this.luxury_box.packaging_id,
            items: items,
            quantity: 1,
            type: 'luxury box',
        });
        return this.save();
    } else {
        throw new Error(`Mix box is not full`);
    }
};
module.exports = mongoose.model('User', userSchema);
