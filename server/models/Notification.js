const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    
    type: {
        type: String,
        enum: ["info", "warning", "error"],
        default: "info"
    },

    expireAt: {
        type: Date,
        default: Date.now,
        index: { expires: '10d' }
    }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
