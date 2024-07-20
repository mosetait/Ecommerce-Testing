const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { accountCreationEmail } = require("../mailTemplate/accountCreation");
const mailSender = require("../utils/mailSender");
const Cart = require("./Cart"); // Import the Cart model

const addressSchema = new mongoose.Schema({
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    contactNumber: { type: String, required: true },
    address: { type: String, required: true }
});

const customerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    gender: {
        type: String,
        enum: ["Male", "Female"]
    },

    mobileNumber: {
        type: Number,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        select: false
    },
    googleId: {
        type: String,
    },
    approved: {
        type: Boolean,
        default: true,
    },
    addresses: [addressSchema],
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart"
    },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }],
    payments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment"
    }],
    ratingAndReview: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "RatingAndReview"
    }],
    complaints: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Complaint"
    }],
    repairRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "RepairRequest"
    }],
    notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification"
    }],
    token: {
        type: String,
    },
    role: {
        type: String,
        enum: ["customer"],
        default: "customer"
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, { timestamps: true });

// Hash password before saving
customerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (err) {
        next(err);
    }
});

// Create cart before saving if new
customerSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const cart = new Cart({ customer: this._id, items: [] });
            const savedCart = await cart.save();
            this.cart = savedCart._id;
            this._wasNew = true; // Set a custom property to indicate the document was new
        } catch (error) {
            console.log("Error occurred while creating cart: ", error);
            next(error);
        }
    }
    next();
});

// compare password
customerSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};


// Generating password reset token
customerSchema.methods.getResetToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    return resetToken;
};

// Send registration email function
async function sendRegistrationEmail(email, name) {
    try {
        const mailResponse = await mailSender(
            email,
            "Registration Email",
            accountCreationEmail(name)
        );
        console.log("Email sent successfully: ", mailResponse?.response);
    } catch (error) {
        console.log("Error occurred while sending email: ", error);
        throw error;
    }
}

module.exports = mongoose.model("Customer", customerSchema);
