const CronJob = require('cron').CronJob;
const DailyStats = require('../models/daily_statistics_model');
const MonthlyStats = require('../models/monthly_statistics_model');
const {
    getOnlineOrdersCount,
    getShopOrdersCount,
    getTotalRevenueAndDiscount,
} = require('./functions/orders_stats');
const { getUsersCount } = require('./functions/user_stats');

const dailyJob = new CronJob(
    '0 1 * * *',
    function () {
        let onlineOrdersPromise = new Promise((resolve) => {
            getOnlineOrdersCount().then((count) => {
                resolve(count);
            });
        });
        let shopOrdersPromise = new Promise((resolve) => {
            getShopOrdersCount().then((count) => {
                resolve(count);
            });
        });
        let totalOrdersPrice = new Promise((resolve) => {
            getTotalRevenueAndDiscount().then((data) => {
                if (data.length) {
                    resolve({
                        revenue: data[0].total,
                        discount: data[0].discount,
                    });
                } else {
                    resolve({});
                }
            });
        });
        let usersCountPromise = new Promise((resolve) => {
            getUsersCount().then((count) => {
                resolve(count);
            });
        });
        Promise.all([
            onlineOrdersPromise,
            shopOrdersPromise,
            totalOrdersPrice,
            usersCountPromise,
        ]).then((result) => {
            let statistics = new DailyStats({
                online_orders: result[0],
                shop_orders: result[1],
                revenue: result[2].revenue,
                discounts: result[2].discount,
                users: result[3],
            });
            statistics.save();
        });
    },
    null,
    true,
    'Africa/Cairo'
);
dailyJob.start();

const monthlyJob = new CronJob(
    '0 1 1 * *',
    function () {
        const getDate = () => {
            let date = new Date();
            date.setDate(date.getDate() - 30);
            return date;
        };
        DailyStats.aggregate([
            { $match: { createdAt: { $gte: getDate() } } },
            {
                $group: {
                    _id: null,
                    online_orders: { $sum: '$online_orders' },
                    shop_orders: { $sum: '$shop_orders' },
                    revenue: { $sum: '$revenue' },
                    discounts: { $sum: '$discounts' },
                    users: { $sum: '$users' },
                },
            },
        ]).then((data) => {
            if (data.length) {
                let monthlyStats = new MonthlyStats({
                    online_orders: data[0].online_orders,
                    shop_orders: data[0].shop_orders,
                    revenue: data[0].revenue,
                    discounts: data[0].discounts,
                    users: data[0].users,
                });
                monthlyStats.save();
            }
        });
    },
    null,
    true,
    'Africa/Cairo'
);
monthlyJob.start();
