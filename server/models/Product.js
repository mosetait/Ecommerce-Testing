const mongoose = require('mongoose');
const Decimal128 = mongoose.Schema.Types.Decimal128;

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter product name"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "Please enter product description"]
    },
    highlights: [
        {
            type: String,
            required: true
        }
    ],
    specifications: [
        {
            title: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            }
        }
    ],
    price: {
        type: Decimal128,
        required: [true, "Please enter product price"]
    },
    cuttedPrice: {
        type: Decimal128,
        required: [true, "Please enter cutted price"]
    },
    gst: {
        type: Decimal128,
        required: true
    },
    themeImage: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    otherImages: [
        {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        }
    ],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Please enter product category"],
        ref: "Category"
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory"
    },
    stock: {
        type: Boolean,
        required: true,
        default: true
    },
    status: {
        type: String,
        enum: ["Draft", "Published"],
        default: "Draft"
    },
    warranty: {
        type: Number,
        default: 1
    },
    ratings: {
        type: Number,
        default: 0
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    reviews: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "RatingAndReview"
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
