const User = require('../../models/user_model');
const getDate = () => {
    let date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
};

exports.getUsersCount = () => {
    return User.find({
        createdAt: { $gte: getDate() },
    }).count();
};
