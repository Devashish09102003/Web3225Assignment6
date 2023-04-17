/*************************************************************************************
* WEB322 - 2231 Project
* I declare that this assignment is my own work in accordance with the Seneca Academic
* Policy. No part of this assignment has been copied manually or electronically from
* any other source (including web sites) or distributed to other students.
*
* Student Name  : Devashish Bharatbhai Khanwani
* Student ID    : 161882212
* Course/Section: WEB322 ZBB
*
**************************************************************************************/

const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require('body-parser')
const nodemailer = require("nodemailer")
const { check, validationResult } = require('express-validator')
const { matchedData, sanitizeBody } = require('express-validator');
const { protect } = require('./middleware/authMiddleware');
const cookieParser = require('cookie-parser');
const busboyBodyParser = require('busboy-body-parser');

const path = require('path')
var passport = require('passport');

const connectDB = require('./config/db')
const { loginUser } = require('./controllers/userController');
const { addRental, listRentals, removeRental, editRental, getRentalById, listRentalsHome } = require('./controllers/rentalController');
const { addCart, editCart, removeCartItem, listCart, placeOrder } = require('./controllers/cartController');
connectDB();

const app = express();
const middleware = (req, res, next) => {
    console.log('hello my middle ware')
    next();
}



app.use(passport.initialize());

// To parse cookies from the HTTP Request
app.use(cookieParser());

app.engine(".hbs", exphbs.engine({
    extname: ".hbs",
    defaultlayout: "main"
}));
app.set("view engine", ".hbs");

const urlencodedParser = bodyParser.urlencoded({ extended: false })
const fileuploadedParser = bodyParser.urlencoded({ extended: true })

//parse multipart/form-data    
app.use(busboyBodyParser());


app.use("/images", express.static("images"));
app.use(express.static("assets"));
app.use(express.static("views"));
// Add your routes here
// e.g. app.get() { ... }
app.get("/", protect, listRentalsHome);



app.get("/welcome", protect, (req, res) => {
    res.render("welcome", { user: req.user });
});

app.get("/sign-up", (req, res) => {
    //const sign-up=req.sign-up;
    res.render("sign-up");
});

app.post('/sign-up', urlencodedParser, [

    check('firstname', '**first name shoud have atleast 4 character')
        .exists().trim().isLength({ min: 4 }),
    check('lastname', '**last name should have atleast 4 character')
        .exists().trim().isLength({ min: 4 }),
    check('email', '**email must be in proper')
        .exists().trim().isEmail().normalizeEmail(),
    check('password', '**password should have atleast 8 character')
        .exists().trim().isLength({ min: 8 })

],

    function (req, res) {
        const errors = validationResult(req);
        console.log(errors.mapped());
        if (!errors.isEmpty()) {
            const user = matchedData(req);

            res.render('sign-up', { error: errors.mapped(), user: user });

        } else {
            let gmail = req.body.email;


            res.redirect('welcome')
            console.log(req.body)
            send();

            async function send(req, res) {

                let transporter = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 587,
                    secure: false,
                    requireTLS: true,
                    auth: {
                        user: 'vishusalvi2008@gmail.com', // generated ethereal user
                        pass: 'mjgxipdojahjzfni', // generated ethereal password
                    },
                });

                const msg = {
                    from: 'vishusalvi2008@gmail.com',
                    to: gmail,
                    subject: "successfully logined to our website",
                    text: "hello dear, have you received the mail",
                    html: "<h1>thanks for registration in dev truenorth marketplace</h1>"
                }

                transporter.sendMail(msg, function (error, info) {
                    if (error) {
                        console.log(error)
                    }
                    else {
                        console.log("Email has been sent" + info.response)
                    }
                });

            }
        }


    });

app.get("/log-in", (req, res) => {
    res.render("log-in");
});

app.post('/log-in', urlencodedParser, [
    check('username', '**username must be in 8 character').trim().isLength({ min: 8 }),
    check('password', '**password must be in 8 character').trim().isLength({ min: 8 })
], loginUser);


/* Rental */
app.get('/rentals', protect, listRentals);

app.get('/rentals/add', protect, (req, res, next) => {
    res.render('rentals/add');
});
app.post('/rentals/add', fileuploadedParser, addRental);

app.get('/rentals/edit/:id', protect, getRentalById);

app.post('/rentals/edit/:id', fileuploadedParser, [
    check('headline', '**Headline should not be blank').notEmpty().trim(),
    check('numSleeps', '**Number sleeps should 0 to 100').isFloat({ min: 0, max: 100 }),
], editRental);

app.get('/rentals/remove/:id', protect, removeRental);


/* Cart */

app.get('/addtocart', (req, res,next) => {
    res.render('addtocart');
});
app.get('/cart', protect, listCart);

app.get('/cart/add/:id', protect, addCart);

app.post('/cart/edit', urlencodedParser, protect, editCart);

app.get('/cart/remove/:id', protect, removeCartItem);

app.get('/cart/placeorder', protect, placeOrder);



/* Global URL */
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

// This use() will add an error handler function to
// catch all errors.
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send("Something broke!")
});


// Define a port to listen to requests on.
const HTTP_PORT = process.env.PORT || 8080;

// Call this function after the http server starts listening for requests.
function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
}

// Listen on port 8080. The default port for http is 80, https is 443. We use 8080 here
// because sometimes port 80 is in use by other applications on the machine
app.listen(HTTP_PORT, onHttpStart);