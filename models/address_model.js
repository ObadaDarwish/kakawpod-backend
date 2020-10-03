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
        apartment: String,
        floor: String,
        landmark: String,
        delivery_fees_id: { type: Schema.Types.ObjectId, ref: 'Area' },
        primary: { type: Boolean, required: true, default: false },
        user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Address', addressSchema, 'addresses');
