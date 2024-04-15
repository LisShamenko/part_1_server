const express = require("express");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
//
require('../../env');
const Account = require('../../db/account');



//
const secret = process.env.SECRET || 'the default secret';

const router = express.Router();

function saveWithPassport(res, account, password) {
    bcrypt.genSalt(10, (err, salt) => {
        if (err) throw err;

        bcrypt.hash(password, salt,
            (err, hash) => {
                if (err) throw err;

                account.password = hash;
                account.save()
                    .then(account => res.status(201).json(account))
                    .catch(err => res.status(400).json(err));
            }
        );
    });
}

router.post('/register', (req, res) => {
    if (!req.body.name || !req.body.email ||
        !req.body.password || !req.body.birth ||
        !req.body.gender || !req.filename
    ) {
        return res.status(400).json('Wrong data.');
    }

    Account.findOne({ email: req.body.email })
        .then(account => {
            if (account) {
                return res.status(400).json('Email Address Exists in Database.');
            }

            const newAccount = new Account({
                name: req.body.name,
                email: req.body.email,
                birth: req.body.birth,
                gender: req.body.gender,
                avatar: req.filename,
                expire: 0,
            });

            saveWithPassport(res, newAccount, req.body.password);
        })
        .catch(err => res.status(400).json(err));
});

function updateExpire(id, expire, resolve, reject) {
    Account.findById(id)
        .then(account => {
            account.expire = expire;
            account.save().then(resolve).catch(reject);
        });
}

function jwtSign(res, account,) {
    const payload = {
        id: account._id,
        name: account.name,
        expire: Date.now(),
    };

    jwt.sign(payload, secret, { expiresIn: 36000 },
        (err, token) => {
            if (err) return res.status(500).json('Error signing token');

            updateExpire(payload.id, Date.now() + (60 * 60 * 24),
                () => res.status(200).json({ token: `Bearer ${token}` }),
                () => res.status(500).json('Update expire error'),
            );
        }
    );
}

router.post('/login', (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json('Wrong data.');
    }

    Account.findOne({ email: req.body.email }).then(account => {
        if (!account) {
            return res.status(404).json('No Account Found');
        }

        bcrypt.compare(req.body.password, account.password).then(isMatch => {
            if (isMatch) {
                jwtSign(res, account);
            }
            else {
                res.status(400).json("Password is incorrect");
            }
        });
    });
});

router.post('/logout',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        if (!req.user.id) {
            return res.status(400).json('Wrong data.');
        }

        updateExpire(req.user.id, 0,
            () => res.status(200).json('OK'),
            () => res.status(500).json('Update expire error'),
        );
    }
);

router.get('/account',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        if (!req.user.email) {
            return res.status(400).json('Wrong data.');
        }

        Account.findOne({ email: req.user.email }).then(account => {
            if (!account) {
                return res.status(404).json('No Account Found');
            }

            return res.status(200).json({
                name: account.name,
                email: account.email,
                birth: account.birth,
                gender: account.gender,
                avatar: account.avatar,
            });
        });
    }
);

router.get('/accounts',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        if (!req.user.id) {
            return res.status(400).json('Wrong data.');
        }

        Account.find({ _id: { $ne: new mongoose.Types.ObjectId(req.user.id), } }, {
            avatar: true,
            name: true,
            email: true,
            birth: true,
            gender: true,
        })
            .then(accounts => {
                return res.status(200).json(accounts);
            });
    }
);

function deleteFile(avatar) {
    fs.unlinkSync(path.join(__dirname, '../../uploads', avatar));
}

router.post('/update',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        if (!req.user.id || !req.body.name || !req.filename ||
            !req.body.oldPassword || !req.body.newPassword
        ) {
            return res.status(400).json('Wrong data.');
        }

        Account.findOne({ _id: new mongoose.Types.ObjectId(req.user.id) })
            .then(account => {
                if (!account) {
                    return res.status(404).json('No Account Found');
                }

                bcrypt.compare(req.body.oldPassword, account.password).then(
                    (isMatch) => {
                        if (!isMatch) {
                            return res.status(400).json("Password is incorrect");
                        }

                        if (req.filename !== account.avatar) {
                            deleteFile(account.avatar);
                            account.avatar = req.filename;
                        }
                        saveWithPassport(res, account, req.body.newPassword);
                    }
                );
            })
            .catch(err => res.status(400).json(err));
    }
);

router.post('/delete',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        if (!req.user.id) {
            return res.status(400).json('Wrong data.');
        }

        Account.findOne({ _id: new mongoose.Types.ObjectId(req.user.id) })
            .then(account => {
                if (!account) {
                    return res.status(404).json('No Account Found');
                }

                Account.deleteOne({ _id: new mongoose.Types.ObjectId(req.user.id) })
                    .then(result => {
                        if (result.deletedCount > 1) {
                            deleteFile(account.avatar);
                            res.status(201).json('OK');
                        }
                        else {
                            res.status(400).json('FAIL');
                        }
                    });
            })
            .catch(err => res.status(400).json(err));
    }
);

module.exports = router;
