const express = require("express");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
//
require('../../env');
const Account = require('../../db/account');



//
const secret = process.env.SECRET || 'the default secret';

const router = express.Router();

router.post('/register', (req, res) => {
    Account.findOne({ email: req.body.email })
        .then(account => {
            if (account) {
                return res.status(400).json('Email Address Exists in Database.');
            }

            const newAccount = new Account({
                name: req.body.name,
                email: req.body.email,
                login: req.body.login,
                password: req.body.password
            });

            bcrypt.genSalt(10, (err, salt) => {
                if (err) throw err;

                bcrypt.hash(newAccount.password, salt,
                    (err, hash) => {
                        if (err) throw err;

                        newAccount.password = hash;
                        newAccount.save()
                            .then(account => res.status(201).json(account))
                            .catch(err => res.status(400).json(err));
                    }
                );
            });
        });
});

router.post('/login', (req, res) => {

    const email = req.body.email;
    const password = req.body.password;

    Account.findOne({ email })
        .then(account => {
            if (!account) {
                return res.status(404).json('No Account Found');
            }

            bcrypt.compare(password, account.password)
                .then(isMatch => {
                    if (isMatch) {
                        const payload = {
                            id: account._id,
                            name: account.name
                        };

                        jwt.sign(payload, secret, { expiresIn: 36000 },
                            (err, token) => {
                                if (err) return res.status(500).json('Error signing token');

                                res.status(200).json({
                                    token: `Bearer ${token}`,
                                });
                            }
                        );
                    }
                    else {
                        res.status(400).json("Password is incorrect");
                    }
                });
        });
});

router.get('/account',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        console.log('--- Account = ', req.user);
        res.status(200).json(req.user);
    }
);

module.exports = router;
