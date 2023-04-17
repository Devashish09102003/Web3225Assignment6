const { default: mongoose } = require('mongoose')
const moongose = require('mongoose')
const connectDB = async() => {
    try {
        console.log("Database connection established");
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`Mongo DB Connected ${conn.connection.host}`)
    } catch (error) { 
        console.log(error)
        // process.exit(1)
        console.log("Re connecting");
        setTimeout(connectDB, 1000);
    }
}

module.exports = connectDB