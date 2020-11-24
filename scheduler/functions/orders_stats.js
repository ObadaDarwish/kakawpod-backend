const Order = require('../../models/order_model');

const getDate = () => {
    let date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
};

exports.getOnlineOrdersCount = () => {
    return Order.find({
        order_type: 'online',
        createdAt: { $gte: getDate() },
    }).count();
};
exports.getShopOrdersCount = () => {
    return Order.find({
        order_type: 'shop',
        createdAt: { $gte: getDate() },
    }).count();
};

exports.getTotalRevenueAndDiscount = () => {
    return Order.aggregate([
        { $match: { createdAt: { $gte: getDate() } } },
        {
            $group: {
                _id: null,
                total: { $sum: '$total' },
                discount: { $sum: '$discount' },
            },
        },
    ]);
};
