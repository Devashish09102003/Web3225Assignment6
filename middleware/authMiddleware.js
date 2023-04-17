const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')

const protect = (req, res, next) => {
    try {

        let token = req.cookies['jwtoken'];
        if (token) {
            // Inject the user to the request
            req.user = req.cookies['loggeduser'];
            next();
        } else {
            res.render('log-in');
        }
    } catch (error) {
        res.render('log-in');
    }
}

module.exports = { protect }