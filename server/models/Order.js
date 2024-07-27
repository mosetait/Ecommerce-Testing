const mongoose = require("mongoose");
const Decimal128 = mongoose.Schema.Types.Decimal128;
const { v4: uuidv4 } = require('uuid'); // Import UUID v4 generator

const orderSchema = new mongoose.Schema({
    
    orderId: {
        type: String,
        default: uuidv4, // Generate UUID v4 as default value
        index: true, // Optional: Index the orderId field for faster lookups
        unique: true, // Optional: Ensure orderId is unique
    },

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },

    orderItems: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Decimal128,
            required: true,
            min: 0
        }
    }],

    paymentInfo: {
        id: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true
        },
    },

    totalPrice: {
        type: Decimal128,
        required: true,
        min: 0
    },

    paidAt: {
        type: Date,
    },

    shippingAddress: {
        type: Object,
        required: true
    },

    paymentStatus: {
        type: String,
        enum: ["pending", "paid" , "Cash on delivery"],
        default: "pending"
    },

    orderStatus: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        default: "pending"
    },

    discountCoupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DiscountCoupon"
    },

    invoice: {
        publicId: String,
        secureUrl: String
    },

    deliveredAt: Date,
    shippedAt: Date,
    
}, { timestamps: true });




module.exports = mongoose.model("Order", orderSchema);
