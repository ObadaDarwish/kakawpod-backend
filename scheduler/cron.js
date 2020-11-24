const CronJob = require('cron').CronJob;
const Stats = require('../models/statistics_model');
const {
    getOnlineOrdersCount,
    getShopOrdersCount,
    getTotalRevenueAndDiscount,
} = require('./functions/orders_stats');
const { getUsersCount } = require('./functions/user_stats');

const job = new CronJob(
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
            let statistics = new Stats({
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
job.start();
