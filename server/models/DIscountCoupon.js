const mongoose = require("mongoose");
const Decimal128 = mongoose.Schema.Types.Decimal128;


const discountCouponSchema = new mongoose.Schema({

    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },

    customers:{
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Customer"
    },

    products:{
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Product"
    },

    discountType: {
        type: String,
        enum: ["fixed", "percentage"],
        required: true
    },

    discountAmount: {
        type: Decimal128,
        min: 0
    },

    validFrom: {
        type: Date,
        required: true
    },
    
    validTo: {
        type: Date,
        required: true
    },

    usageLimit: {
        type: Number,
        default: null,
        min: 0
    },

    usageCount: {
        type: Number,
        default: 0,
        min: 0
    },

    isActive: {
        type: Boolean,
        default: true
    },

}, { timestamps: true });

module.exports = mongoose.model("DiscountCoupon", discountCouponSchema);
