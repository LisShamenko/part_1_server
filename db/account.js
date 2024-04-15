const mongoose = require('mongoose');



// 
const Schema = mongoose.Schema;

const AccountSchema = new Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    birth: { type: String, required: true },
    gender: { type: String, required: true },
    avatar: { type: String, required: true },
    expire: { type: Number, required: true },
});

const Account = mongoose.model('Account', AccountSchema);

module.exports = Account;
