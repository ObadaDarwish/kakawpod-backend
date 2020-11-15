const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        cocoa_percentage: {
            type: String,
            required: true,
        },
        ingredients: {
            type: String,
            required: true,
        },
        images: [
            {
                url: {
                    type: String,
                    required: true,
                },
            },
        ],
        price: {
            type: Number,
            required: true,
        },
        discount: {
            type: Number,
            default: 0,
        },
        quantity: {
            type: Number,
            required: true,
        },
        weight: {
            type: Number,
            required: true,
        },
        chocolate_type: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
        sold: { type: Number, default: 0 },
        user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
