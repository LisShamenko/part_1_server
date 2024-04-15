const express = require('express');
const cp = require('cookie-parser');
const bp = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const multer = require("multer");
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



// multer
const storageConfig = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        req.filename = file.originalname;
        cb(null, file.originalname);
    }
});

const useMulter = multer({
    storage: storageConfig,
}).single("file");



// server
const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(passportHandler);
app.use(cp());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(useMulter);

app.use((req, res, next) => {
    console.log('--------------------------------');
    console.log('METHOD = ', req.method);
    if (req.body) console.log('BODY\n', req.body);
    if (req.params) console.log('PARAMS\n', req.params);
    if (req.query) console.log('QUERY\n', req.query);
    next();
});

app.use('/api', accountController);

app.listen(port, err => {
    console.log('--- Server --- listen ERROR  = ', err);
    console.log(`--- http://localhost:${port}`);
});
