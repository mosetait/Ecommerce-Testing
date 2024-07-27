const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");


const repairRequestSchema = new mongoose.Schema({

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    requestId: {
        type: String,
        required: true,
        default: uuidv4  // Automatically generate a UUID
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    serialNumber:{
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    contactNumber: {
        type: String,
        required: true
    },

    address: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["pending", "processing", "completed", "cancelled"],
        default: "pending"
    },
    
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Technician" // Assuming there's a technician model representing technicians or staff
    },
    
    notes: {
        type: String
    },

}, {timestamps: true});

module.exports = mongoose.model("RepairRequest", repairRequestSchema);
