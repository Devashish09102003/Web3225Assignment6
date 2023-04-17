const asyncHandler = require('express-async-handler')
const Rental = require('../models/rentalModel');
const Cart = require('../models/cartModel');
const { validationResult, matchedData } = require('express-validator');
var fs = require('fs');
const { parse } = require('path');
var mongoose = require('mongoose');
const transporter = require('../middleware/mailMiddleware');
const { error } = require('console');
const { rejects } = require('assert');



const addCart = asyncHandler(async (req, res) => {
    const cartsave = await Cart.create({
        customerid: req.user._id,
        rentalid: req.params.id
    })
    res.redirect("/addtocart/")
});

const editCart = async (req, res) => {
    const cartsave = await Cart.findByIdAndUpdate(req.body.cartid, {
        numOfNight: req.body.numOfNight
    })
    res.redirect("/cart/");
}

const ListObject = async (custid) => {
    const cartlist = await Cart.find({ customerid: custid }).populate("rentalid").lean();
    let totalPrice = 0;
    let vat = 0;
    let grandTotal = 0;
    for (var i = 0; i < cartlist.length; i++) {
        totalPrice += cartlist[i].rentalid.pricePerNight * cartlist[i].numOfNight;
    }
    vat = totalPrice * 0.10;
    grandTotal = totalPrice + vat;
    return {
        cartlist: cartlist,
        totalPrice: totalPrice,
        vat: vat,
        grandTotal: grandTotal
    };
}

const listCart = async (req, res) => {
    try {
        let custid = new mongoose.Types.ObjectId(req.user._id);
        const cartlist = await ListObject(custid);
        res.render("cart", { grandTotal: cartlist.grandTotal, vat: cartlist.vat, total: cartlist.totalPrice, items: cartlist.cartlist });
    } catch (error) {
        res.render("cart", { items: [], total: 0, vat: 0, grandTotal: 0, totalPrice: 0 });
    }
}

const removeCartItem = async (req, res) => {
    const remove = await Cart.findByIdAndDelete(req.params.id);
    res.redirect("/cart/")
}

const placeOrder = async (req, res) => {
    try {
        let custid = new mongoose.Types.ObjectId(req.user._id);
        const cartlist = await ListObject(custid);
        let cartitems = cartlist.cartlist;
        let table = "<table style='width: 100%;' border='1'>";
        table += "<tr>";
        table += `<th>Headline</th>`;
        table += `<th>City</th>`;
        table += `<th>Province</th>`;
        table += `<th>Price Per Night</th>`;
        table += `<th>Number of Night</th>`;
        table += "</tr>";
        for (var i = 0; i < cartitems.length; i++) {
            table += "<tr>";
            table += `<td>${cartitems[i].rentalid.headline}</td>`;
            table += `<td>${cartitems[i].rentalid.city}</td>`;
            table += `<td>${cartitems[i].rentalid.province}</td>`;
            table += `<td>${cartitems[i].rentalid.pricePerNight}</td>`;
            table += `<td>${cartitems[i].numOfNight}</td>`;
            table += "</tr>";
        }
        table += `</table>`;

        var mailOptions = {
            from: process.env.Email_User,
            to: req.user.email,
            subject: 'Order Place Successfully',
            html: `
            <h1>Placed Order Details</h1>
            <h2>Order Summary</h2>
            ${table}
            <p><strong>Sub Total:</strong> ${cartlist.totalPrice}</p>
            <p><strong>Vat:</strong> ${cartlist.vat}</p>
            <p><strong>Grand Total:</strong> ${cartlist.grandTotal}</p>
            `
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
        let delorder = await Cart.deleteMany({ customerid: custid });
        res.render('orderplace');
    } catch (error) {
        res.render("cart", { items: [], total: 0, vat: 0, grandTotal: 0, totalPrice: 0 });
    }
}

module.exports = { addCart, editCart, listCart, removeCartItem, placeOrder };