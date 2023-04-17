const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const { json } = require('express')
const { resolveHostname } = require('nodemailer/lib/shared')
const { check, validationResult } = require('express-validator');
const { matchedData, sanitizeBody } = require('express-validator');
const passport = require('../middleware/passport')
//@desc Register New User
//@route POST api/user
//@access Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, phoneNumber, is_active } = req.body

    if (!name || !email || !password || !role) {
        res.status(400)
        throw new Error('Name, Email, Password and Role  fields are required!')
    }

    //check if user exist
    const userExists = await User.findOne({ email })
    if (userExists) {
        res.status(400)
        throw new Error('User Already Exists!')
    }

    //Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    //create user
    const user = await User.create({
        name,
        email,
        role,
        phoneNumber,
        password: hashedPassword,
        is_active: is_active
    })

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
    getAllUser
}