const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema(
    {
        items: [
            {
                item_id: { type: Schema.Types.ObjectId, ref: 'Product' },
                price: String,
                sub_items: [
                    {
                        sub_item_id: {
                            type: Schema.Types.ObjectId,
                            ref: 'Product',
                        },
                        quantity: Number,
                    },
                ],
                quantity: Number,
            },
        ],
        status: { type: String, required: true },
        total: { type: Number, required: true },
        address_id: { type: Schema.Types.ObjectId, ref: 'Address' },
        user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
