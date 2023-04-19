const mongoose = require('mongoose')
//mongoose.set('strictQuery', false)

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    lname: {
      type: String,
      required: [true, 'Please add a last name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
    },
    phoneNumber: {
      type: Number,
      default: null
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    role: {
      type: String,
      required: [true, 'Please add a role'],
    },
    is_active:{
      type:Boolean,
      default:true
    }
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('User', userSchema)