exports.filterUser = (user) => {
    let userObj = user.toObject();
    delete userObj.password;
    return userObj;
};
