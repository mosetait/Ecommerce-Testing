const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const complaintSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    complaintId: {
        type: String,
        required: true,
        default: uuidv4  // Automatically generate a UUID
    },
    nature: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    address:{
        type: String,
        required: true
    },
    serialNumber:{
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "resolved", "closed"],
        default: "pending"
    },
    comment: {
        type: String,
        required: true,
        default: "We received your complaint. Please wait while we process your complaint. Thank you for your patience."
    },
    bill: {
        publicId: String,
        secureUrl: String
    },
    contactNumber: {
        type: Number,
        required: true
    },
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Technician"
    }
}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);
