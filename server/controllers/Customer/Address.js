const Customer = require("../../models/Customer");
const asyncHandler = require("../../middlewares/asyncHandler");
const ErrorHandler = require("../../utils/errorHandler");
const mongoose = require("mongoose");






// Add address
exports.addAddress = asyncHandler(async (req, res, next) => {
    const {
        city,
        state,
        postalCode,
        country,
        contactNumber,
        address,
    } = req.body.currentAddress;


    if (!city || !state || !postalCode || !country || !contactNumber || !address) {
        return next(new ErrorHandler("All fields are required.", 401));
    }

    const customer = await Customer.findById(req.user.id);

    if (!customer) {
        return next(new ErrorHandler("Customer Not Found.", 404));
    }

    customer.addresses.push({
        city,
        state,
        postalCode,
        country,
        contactNumber,
        address,
    });

    await customer.save();

    res.status(200).json({
        success: true,
        message: "Address added successfully.",
        customer,
    });
});




// Edit address
exports.editAddress = asyncHandler(async (req, res, next) => {

    const {

        city,
        state,
        postalCode,
        country,
        contactNumber,
        address,

    } = req.body.currentAddress;

    const {addressId} = req.body;

    if (!city || !state || !postalCode || !country || !contactNumber || !address) {
        return next(new ErrorHandler("All fields are required.", 401));
    }

    const customer = await Customer.findById(req.user.id);

    if (!customer) {
        return next(new ErrorHandler("Customer Not Found.", 404));
    }

    const addressIndex = customer.addresses.findIndex(
        (addr) => addr._id.toString() === addressId.toString()
    );


    if (addressIndex === -1) {
        return next(new ErrorHandler("Address Not Found.", 404));
    }

    customer.addresses[addressIndex] = {
        _id: addressId,
        city,
        state,
        postalCode,
        country,
        contactNumber,
        address,
    };

    await customer.save();

    res.status(200).json({
        success: true,
        message: "Address updated successfully.",
        customer
    });
});




// Delete address
exports.deleteAddress = asyncHandler(async (req, res, next) => {
    
    const { addressId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
        return next(new ErrorHandler("Invalid address ID.", 400));
    }

    const customer = await Customer.findById(req.user.id);

    if (!customer) {
        return next(new ErrorHandler("Customer Not Found.", 404));
    }

    const addressIndex = customer.addresses.findIndex(
        (addr) =>  addr._id.toString() == addressId.toString()
    );

    if (addressIndex === -1) {
        return next(new ErrorHandler("Address Not Found.", 404));
    }

    customer.addresses.splice(addressIndex, 1);

    await customer.save();

    res.status(200).json({
        success: true,
        message: "Address deleted successfully.",
        customer: customer,
    });
});
