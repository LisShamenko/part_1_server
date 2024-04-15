const { Strategy, ExtractJwt } = require('passport-jwt');
//
require('./env');
const Account = require('./db/account');



// 
const secret = process.env.SECRET || 'secret';

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secret
};

const strategy = new Strategy(options,
    (payload, done) => {
        Account.findById(payload.id)
            .then(account => {
                if (!account) return done(null, false);
                if (payload.expire > account.expire) return done(null, false);

                return done(null, {
                    id: account.id,
                    name: account.name,
                    email: account.email,
                });
            })
            .catch(err => {
                console.error('--- passport ERROR = ', err)
            });
    }
);

module.exports = strategy;
