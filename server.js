const express = require('express');
const cp = require('cookie-parser');
const bp = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
// 
require('./env');
const strategy = require('./strategy');
const accountController = require('./modules/Account/account.controller');



// db
const port = process.env.PORT || 3000;
const mHost = process.env.MONGO_HOST || "localhost";
const mPort = process.env.MONGO_PORT || "27017";
const mCollection = process.env.MONGO_COLLECTION || "accounts";

mongoose.connect(`mongodb://${mHost}:${mPort}/${mCollection}`)
    .then(() => console.log('--- MongoDB --- connected OK'))
    .catch(err => console.log('--- MongoDB --- connected ERROR  = ', err));



// passport
const passportHandler = passport.initialize();
passport.use(strategy);



// server
const app = express();
app.use(passportHandler);
app.use(cp());
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

app.use((req, res, next) => {
    console.log('--------------------------------');
    console.log('METHOD = ', req.method);
    if (req.body) console.log('BODY\n', req.body);
    if (req.params) console.log('PARAMS\n', req.params);
    if (req.query) console.log('QUERY\n', req.query);
    next();
});

app.use('/accounts', accountController);

app.listen(port, err => {
    console.log('--- Server --- listen ERROR  = ', err);
    console.log(`--- http://localhost:${port}`);
});
