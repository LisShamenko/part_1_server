const mongoose = require('mongoose');



// 
const Schema = mongoose.Schema;

const AccountSchema = new Schema({
    name: String,
    email: {
        type: String,
        required: true,
        unique: true,
    },
    login: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    }
});

const Account = mongoose.model('Account', AccountSchema);

module.exports = Account;
