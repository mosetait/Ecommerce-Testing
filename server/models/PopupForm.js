const mongoose = require("mongoose");


const popupSchema = new mongoose.Schema({

    fullName: {
        type: String,
        required: true
    },

    email:{
        type: String,
        required: true
    },
    
    phone: {
        type: Number,
        required: true
    },

    inquiry:{
        type: String,
        required: true
    },

    comment: {
        type: String
    },

    status:{
        type: String,
        enum: ["marked" , "unmarked"],
        default: "unmarked",
        required: true
    }

    
}, { timestamps: true });




module.exports = mongoose.model("PopupForm", popupSchema);
