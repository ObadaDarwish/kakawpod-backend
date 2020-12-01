const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MonthlyStatisticsSchema = new Schema(
    {
        revenue: {
            type: Number,
        },
        online_orders: {
            type: Number,
        },
        shop_orders: {
            type: Number,
        },
        discounts: {
            type: Number,
        },
        users: {
            type: Number,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('MonthlyStatistics', MonthlyStatisticsSchema);
