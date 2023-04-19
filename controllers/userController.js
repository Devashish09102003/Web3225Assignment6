const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const { json } = require('express')
const { resolveHostname } = require('nodemailer/lib/shared')
const { check, validationResult } = require('express-validator');
const { matchedData, sanitizeBody } = require('express-validator');
const passport = require('../middleware/passport')
const transporter = require('../middleware/mailMiddleware')
//@desc Register New User
//@route POST api/user
//@access Public
const registerUser = asyncHandler(async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.render('sign-up', { error: errors.mapped(), user: req.body });
        return;
    }
    const { name, lname, email, password, role, phoneNumber, is_active } = req.body

    //check if user exist
    const userExists = await User.findOne({ email })
    if (userExists) {
        res.render('sign-up', { errormessage: 'User Already Exists!', user: req.body });
        return;
    }

    //Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    //create user
    const user = await User.create({
        name,
        lname,
        email,
        role,
        phoneNumber,
        password: hashedPassword,
        is_active: is_active
    })

    if (user) {
        try {
            var mailOptions = {
                from: process.env.Email_User,
                to: user.email,
                subject: 'Successfully logined to our website',
                html: `<h1>Thanks for registration in dev truenorth marketplace</h1>`
            }
            let response = await new Promise((resolve, rejects) => {
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                        rejects(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                        resolve(info);
                    }
                });
            });
        } catch (error) {
            console.log(error);
        }

        res.cookie('jwtoken', generateToken(user.id));
        res.cookie('loggeduser', user);
        res.cookie('loggedusername', user.name);
        res.cookie('role', user.role);
        res.redirect('/welcome');
        // res.status(201).json({
        //     _id: user.id,
        //     name: user.name,
        //     email: user.email,
        //     role: user.role,
        //     phoneNumber: phoneNumber,
        //     is_active: is_active,
        //     token: generateToken(user.id),
        // })
    }
    else {
        res.render('sign-up', { errormessage: "Invalid user data!", user: req.body });
        return;
    }
})

const updateUser = asyncHandler(async (req, res) => {
    const { name, id, role, phoneNumber, email, is_active } = req.body

    if (!name || !role) {
        res.status(400)
        throw new Error('Name and Role  fields are required!')
    }
    if (!id) {
        res.status(400)
        throw new Error('User id not found!')
    }

    //check if user exist
    const userExists = await User.findOne({ _id: id });
    if (!userExists) {
        res.status(400)
        throw new Error('User Not Found')
    }

    let user = await User.findByIdAndUpdate(id, {
        name: name,
        role: role,
        email: email,
        phoneNumber: phoneNumber,
        is_active: is_active
    });
    user = await User.findOne({ _id: id });
    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phoneNumber: phoneNumber,
            is_active: is_active,
            token: generateToken(user.id),
        })
    }
    else {
        res.status(400)
        throw new Error("Invalid user data!")
    }
})

const changePassword = asyncHandler(async (req, res) => {
    const { id, currentPassword, newPassword } = req.body

    if (!id || !currentPassword || !newPassword) {
        res.status(400)
        throw new Error('id, current password and new password field not found!')
    }

    //check if user exist
    const userExists = await User.findOne({ _id: id });
    if (!userExists) {
        res.status(400)
        throw new Error('User Not Found')
    }

    let user = await User.findOne({ _id: id });
    if (user) {
        if ((await bcrypt.compare(currentPassword, user.password))) {
            //Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            await User.findByIdAndUpdate(id, {
                password: hashedPassword
            });
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.id),
            })
        }
        else {
            res.status(400)
            throw new Error("Wrong Current Password!")
        }
    }
    else {
        res.status(400)
        throw new Error("Invalid user data!")
    }
})

//@desc Authenticate a User
//@route POST api/users/login
//@access Public
const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const user = matchedData(req);
        res.render('log-in', { error: errors.mapped(), user: user });
    } else {
        passport.authenticate('local', (data, err) => {
            if (err) {
                const user = matchedData(req);
                res.render('log-in', { error: err, user: user })
                console.log(err.name + ':' + err.message);
            } else {
                if (data.user != null) {
                    delete data.user.password;

                    res.cookie('jwtoken', data.token);
                    res.cookie('loggeduser', data.user);
                    res.cookie('loggedusername', data.user.name);
                    res.cookie('role', data.user.role);
                    res.redirect('/welcome');
                }
                else {
                    const user = matchedData(req);
                    res.render('log-in', { error: err, user: user })
                }
            }
        })(req, res, next);
    }
})


const logoutUser = (req, res, next) => {

    res.clearCookie('jwtoken');
    res.clearCookie('loggeduser');
    res.clearCookie('loggedusername');
    res.clearCookie('role');
    res.render("log-in");
}

//@desc Get User Data
//@route POST api/users/me
//@access Private
const getUserById = asyncHandler(async (req, res) => {
    const { _id, name, email, role, is_active, phoneNumber } = await User.findById(req.params.id)

    res.status(200).json({
        id: _id,
        name,
        email,
        role,
        is_active,
        phoneNumber
    })
})

//@desc Get User Data
//@route POST api/users/me
//@access Private
const getManager = asyncHandler(async (req, res) => {
    try {
        const user = await User.findOne({ role: new RegExp("manager", 'i'), is_active: true }, { _id: 1, email: 1, name: 1, role: 1 });

        res.status(200).json(user).end();
    } catch (err) {
        return res.status(400).json({
            success: false,
            msg: "Error in getting manager. " + err.message,
            data: null,
        });
    }
})

//@desc Get User Data
//@route POST api/users/me
//@access Private
const getAllUser = asyncHandler(async (req, res) => {
    try {
        const user = await User.find({}, { _id: 1, email: 1, name: 1, role: 1, is_active: 1, phoneNumber: 1 }).sort({ 'is_active': -1, name: 1 });
        res.status(200).json(user).end();
    } catch (err) {
        return res.status(400).json({
            success: false,
            msg: "Error in getting USER. " + err.message,
            data: null,
        });
    }
})

//Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    })
}



module.exports = {
    registerUser,
    loginUser,
    getUserById,
    updateUser,
    changePassword,
    getManager,
    getAllUser,
    logoutUser
}