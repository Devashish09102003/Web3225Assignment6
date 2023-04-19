var passport = require('passport');
var strategy = require('passport-local');
let jwt = require('jsonwebtoken');
const User = require('../models/userModel')
const bcrypt = require('bcryptjs')

passport.use(new strategy({ session: false }, async (email, password, callback) => {
    const user = await User.findOne({ email: email, is_active: true });
    if (!user) {
        callback(null, "User not found");
        return;
    }

    if ((await bcrypt.compare(password, user.password))) {
        try {
            let token = jwt.sign(user.toJSON(), process.env.JWT_SECRET);
            callback({ user: user, token: token });
        } catch (error) {
            callback(null, error.message);
        }
    } else {
        callback({ user: null, token: null });
    }

}));

module.exports = passport;