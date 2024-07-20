const { resetPassword } = require("../../mailTemplate/resetPassword");
const asyncHandler = require("../../middlewares/asyncHandler");
const Customer = require("../../models/Customer");
const mailSender = require("../../utils/mailSender");
const ErrorHandler = require("../../utils/errorHandler");
const crypto = require("crypto");
const { passwordUpdated } = require("../../mailTemplate/passwordUpdate");


// Forgot Password
exports.forgotPassword = asyncHandler(async (req, res, next) => {

    const {email} = req.body;

    if(!email){
        return next(new ErrorHandler("Provide an Email", 401));
    }
    
    const customer = await Customer.findOne({email});

    if(!customer) {
        return next(new ErrorHandler("Customer Not Found", 404));
    }

    const resetToken = await customer.getResetToken();

    await customer.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`;
    // const resetPasswordUrl = `https://${req.get("host")}/password/reset/${resetToken}`;

    // const message = `Your password reset token is : \n\n ${resetPasswordUrl}`;

    try {
        await mailSender(
            email,
            "RESET PASSWORD",
            resetPassword(customer.firstName , resetPasswordUrl)
        );

        res.status(200).json({
            success: true,
            message: `Email sent to ${customer.email} successfully`,
        });

    } catch (error) {
        customer.resetPasswordToken = undefined;
        customer.resetPasswordExpire = undefined;

        await customer.save({ validateBeforeSave: false });
        return next(new ErrorHandler(error.message, 500))
    }
});



// Reset Password
exports.resetPassword = asyncHandler(async (req, res, next) => {

    const {password} = req.body;

    if(!password){
        return next (new ErrorHandler("New Password is required." , 401));
    }
 
    // create hash token
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const customer = await Customer.findOne({ 
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if(!customer) {
        return next(new ErrorHandler("Invalid reset password token", 404));
    }

    customer.password = req.body.password;
    customer.resetPasswordToken = undefined;
    customer.resetPasswordExpire = undefined;

    await customer.save();

    // send email
    try{
        await mailSender(
            customer.email,
            "Password Reset Successfully",
            passwordUpdated(customer.email , customer.firstName)
        );
    }
    catch(error){
        throw new Error(error);
    }

    return res.status(200).json({
        message: "Password reset successfully",
        success: true
    });
});




// Update Password
exports.updatePassword = asyncHandler(async (req, res, next) => {
    
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return next(new ErrorHandler("Provide both old and new passwords."));
    }

    const customer = await Customer.findById(req.user.id).select("+password");

    if (!customer.password) {
        // Customer doesn't have a password, create and save a new password
        customer.password = newPassword;
        await customer.save();

        // Send email
        try {
            await mailSender(
                customer.email,
                "Password Created Successfully",
                passwordUpdated(customer.email, customer.firstName)
            );
        } catch (error) {
            throw new Error(error);
        }

        return res.status(200).json({
            message: "Password created successfully",
            success: true
        });
    }

    const isPasswordMatched = await customer.comparePassword(oldPassword);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Old Password is Invalid", 400));
    }

    customer.password = newPassword;
    await customer.save();

    // Send email
    try {
        await mailSender(
            customer.email,
            "Password Updated Successfully",
            passwordUpdated(customer.email, customer.firstName)
        );
    } catch (error) {
        throw new Error(error);
    }

    return res.status(200).json({
        message: "Password Updated successfully",
        success: true
    });
});




// Update User Profile
exports.updateProfile = asyncHandler(async (req, res, next) => {

    const {
        firstName,
        lastName,
        gender,
        mobileNumber,
    } = req.body.updatedUser;


    if(!firstName || !lastName){
        return next (new ErrorHandler("First name and Last name is mandatory."));
    }

    const user = await Customer.findByIdAndUpdate(req.user.id, 
        {
            firstName,
            lastName,
            gender,
            mobileNumber,
        }, 
        
        {
        new: true,
        runValidators: true,
        useFindAndModify: true,
    });

    res.status(200).json({
        success: true,
        user
    });
});