const mongoose = require("mongoose");

const technicianSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true
    },

    lastName: {
        type: String,
        required: true
    },

    image:{
        url: String, 
        publicId: String 
    },

    email: {
        type: String,
        unique: true
    },

    contactNumber: {
        type: String,
        required: true
    },

    address: {
        type: String
    },

    expertise: {
        type: [String], // Array of expertise/specializations
        required: true
    },

    status: {
        type: String,
        enum: ["available", "unavailable"],
        default: "available"
    },

    complaints: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Complaint"
    }

}, {timestamps: true});

module.exports = mongoose.model("Technician", technicianSchema);
