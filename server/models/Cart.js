const mongoose = require("mongoose");
const Decimal128 = mongoose.Schema.Types.Decimal128;


// sub schema
const cartItemSchema = new mongoose.Schema({

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
        required: true
    }

}, { _id: false });




// main schema
const cartSchema = new mongoose.Schema({

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },

    items: [cartItemSchema],

    totalPrice: {
        type: Decimal128,
        required: true,
        default: 0
    },

}, { timestamps: true });


// Calculate total price before saving
cartSchema.pre('save', function(next) {
    this.totalPrice = this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    next();
});


module.exports = mongoose.model("Cart", cartSchema);
