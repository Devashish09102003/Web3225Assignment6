const asyncHandler = require('express-async-handler')
const Rental = require('../models/rentalModel');
const { validationResult, matchedData } = require('express-validator');
var fs = require('fs');
const { parse } = require('path');

const GenerateFileName = () => {
    let name = "";
    for (let index = 0; index < 4; index++) {
        if (index == 0) {
            name = Math.round(Math.random() * 10000);
        } else {
            name += "-" + Math.round(Math.random() * 10000);
        }
    }
    return name;
}

const addRental = asyncHandler(async (req, res) => {
    try {
        const errors = validationResult(req);
        const user = matchedData(req);
        if (!errors.isEmpty()) {
            res.render('rentals/add', { error: errors.mapped(), user: req.body });
        } else {
            const imageUrl = req.files?.imageUrl;
            let filepath;
            if (imageUrl) {
                filepath = `images/${GenerateFileName()}.png`;
                var fileStream = fs.createWriteStream(filepath);
                fileStream.write(imageUrl.data);
                fileStream.end();
            } else {
                res.render('rental/add', { msg: "Please select image", user: req.body });
                return;
            }

            const RentalSave = await Rental.create({
                headline: req.body.headline,
                numSleeps: parseInt(req.body.numSleeps),
                numBedrooms: parseInt(req.body.numBedrooms),
                numBathrooms: parseInt(req.body.numBathrooms),
                pricePerNight: parseFloat(req.body.pricePerNight).toFixed(2),
                city: req.body.city,
                province: req.body.province,
                imageUrl: filepath,
                featuredRental: !req.body.featuredRental ? false : true
            });
            if (RentalSave) {
                res.redirect("/rentals/")
                // res.render('rental/add', { msg: "Rental Added successfully.", user: req.body });
            }
            else {
                res.render('rentals/add', { msg: "Invalid rental data! ", user: req.body });
            }
        }
    } catch (err) {
        res.render('rentals/add', { msg: "Error in saving rental data. " + err.message, user: req.body });
    }
});

const getRentalById = async (req, res) => {
    const rental = await Rental.findById(req.params.id).lean();
    res.render("rentals/edit", { user: rental });
}

const editRental = asyncHandler(async (req, res) => {
    try {
        const errors = validationResult(req);
        const user = matchedData(req);
        if (!errors.isEmpty()) {
            let err = errors.mapped();
            res.render('rentals/edit', { error: err, user: req.body });
        } else {
            const imageUrl = req.files?.imageUrlNew;
            let filepath = req.body.imageUrl;
            if (imageUrl) {
                filepath = `images/${GenerateFileName()}.png`;
                var fileStream = fs.createWriteStream(filepath);
                fileStream.write(imageUrl.data);
                fileStream.end();
            }

            const RentalSave = await Rental.findByIdAndUpdate(req.params.id, {
                headline: req.body.headline,
                numSleeps: parseInt(req.body.numSleeps),
                numBedrooms: parseInt(req.body.numBedrooms),
                numBathrooms: parseInt(req.body.numBathrooms),
                pricePerNight: parseFloat(req.body.pricePerNight).toFixed(2),
                city: req.body.city,
                province: req.body.province,
                imageUrl: filepath,
                featuredRental: !req.body.featuredRental ? false : true
            });
            if (RentalSave) {
                res.redirect("/rentals/")
                // res.render('rental/add', { msg: "Rental Added successfully.", user: req.body });
            }
            else {
                res.render('rentals/add', { msg: "Invalid student data! ", user: req.body });
            }
        }
    } catch (err) {
        res.render('rentals/add', { msg: "Error in saving student. " + err.message, user: req.body });
    }
});

const listRentals = async (req, res) => {
    const list = await Rental.aggregate([
        {
            '$group': {
                '_id': '$city',
                'cities': {
                    '$push': '$$ROOT'
                }
            }
        }
    ]);
    res.render('rentals/list', { rentals: list, isclerk: req.user.role == "clerk" });
}

const listRentalsHome = async (req, res) => {
    const list = await Rental.aggregate([
        {
            $match:
            {
                featuredRental: true,
            },
        },
        {

            '$group': {
                '_id': '$city',
                'cities': {
                    '$push': '$$ROOT'
                }
            }
        }
    ]);
    res.render('rentals/list', { rentals: list, isclerk: req.user.role == "clerk" });
}

const removeRental = async (req, res) => {
    const remove = await Rental.findByIdAndDelete(req.params.id);
    res.redirect("/rentals/")
}


module.exports = { addRental, listRentals, removeRental, editRental, getRentalById, listRentalsHome };