const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const codeSchema = new Schema(
    {
        code: { type: String, required: true, unique: true },
        percentage: { type: Number, required: true },
        count: { type: Number, required: true },
        max_discount: { type: Number, required: true },
        is_active: { type: Boolean, required: true },
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Code', codeSchema);
