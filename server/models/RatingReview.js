const mongoose = require("mongoose");

const ratingAndReviewSchema = new mongoose.Schema({

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Customer"
    },

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5 // Assuming ratings are on a scale of 1 to 5
    },

    review: {
        type: String,
        required: true
    },

    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Product",
        index: true // Indexing product for efficient queries
    },
    
    allowed: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

module.exports = mongoose.model("RatingAndReview", ratingAndReviewSchema);
