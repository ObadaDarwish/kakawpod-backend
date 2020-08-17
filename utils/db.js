const mongoose = require('mongoose');
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0-isb7p.mongodb.net/ODs?retryWrites=true&w=majority`;
const mongoConnection = () => {
    return mongoose.connect(url);
};
module.exports = mongoConnection;
