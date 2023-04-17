const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')
//mongoose.set('strictQuery', false)

const cartSchema = mongoose.Schema(
  {
    customerid: {
      type: ObjectId,
      ref: "User",
    },
    rentalid: {
      type: ObjectId,
      ref: "Rental",
    },
    numOfNight: {
      type: Number,
      default: 1,
      required: [true, 'Please add number of night']
    }
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Cart', cartSchema)