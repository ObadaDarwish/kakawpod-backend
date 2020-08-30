const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema(
    {
        country: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        area: {
            type: String,
            required: true,
        },
        street: {
            type: String,
            required: true,
        },
        building: {
            type: String,
            required: true,
        },
        floor: String,
        landmark: String,
        delivery_fees: { type: Number, required: true },
        user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Address', addressSchema, 'addresses');
