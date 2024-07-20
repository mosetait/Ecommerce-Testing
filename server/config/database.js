const mongoose = require("mongoose");

const connectDB = () => {
 
    mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log("DB connected successfully"))
    .catch ((error) => {
        console.log("DB Connection Failed");
        console.error(error);
        process.exit(1);
    })

}

module.exports = connectDB;