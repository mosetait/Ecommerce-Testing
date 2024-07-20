const mongoose = require("mongoose");

const carouselSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        unique: true
    },

    images: [
        {
            public_id: {
                type: String,
                required: true
            },

            url: {
                type: String,
                required: true
            },
        }
    ],

    active: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

module.exports = mongoose.model("Carousel", carouselSchema);
