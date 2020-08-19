const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const addressSchema = new Schema({
    country: {
        type: String,
        required:true
    },
    city: {
        type: String,
        required:true
    },
    area: {
        type: String,
        required:true
    },
    street: {
        type: String,
        required:true
    },
    building: {
        type: String,
        required:true
    },
    floor: String,
    landmark: String,
    user_id: {type: Schema.Types.ObjectId, ref: 'User'}
}, {timestamp: true})

module.exports = mongoose.model('Address', addressSchema,'addresses');
