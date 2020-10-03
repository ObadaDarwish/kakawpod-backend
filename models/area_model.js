const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const areaSchema = new Schema(
    {
        area: {
            type: String,
            required: true,
        },
        city: { type: String, required: true },
        fee: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Area', areaSchema);
