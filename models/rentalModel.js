const mongoose = require('mongoose')
//mongoose.set('strictQuery', false)

const rentalSchema = mongoose.Schema(
  {
    headline: {
      type: String,
      required: [true, 'Please add a headline'],
    },
    numSleeps: {
      type: Number,
      required: [true, 'Please add an numer sleeps']
    },
    numBedrooms: {
      type: Number,
      required: [true, 'Please add valid number of rooms']
    },
    numBathrooms: {
      type: Number,
      required: [true, 'Please add valid number of bathrooms'],
    },
    pricePerNight: {
      type: mongoose.Schema.Types.Decimal128,
      required:[true, 'Please add valid value for price per night'],
    },
    city: {
      type: String,
      required: [true, 'Please add valid city'],
    },
    province: {
      type: String,
      required: [true, 'Please add valid province'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Please add valid image url'],
    },
    featuredRental:{
      type:Boolean,
      default:true
    }
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Rental', rentalSchema)