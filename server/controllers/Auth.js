const asyncHandler = require("../middlewares/asyncHandler");
const Customer = require("../models/Customer");
const Admin = require("../models/Admin");
const OTP = require("../models/OTP");
const passport = require("passport")
const Cart = require("../models/Cart");
const { accountCreationEmail } = require("../mailTemplate/accountCreation");
const mailSender = require("../utils/mailSender");
const mongoose = require("mongoose")


const generateOtp = () => {
    return Math.floor(1000 +  Math.random() * 9000);
}



// Send OTP
exports.sendOtp = asyncHandler( async (req,res) => {


        const {email} = req.body;

        if(!email) {
            return res.status(401).json({
                message: "Please provide an email",
                success: false
            })
        }

        // check if customer already exist or not
        const existingCustomer = await Customer.findOne({email});

        const prevOtp = await OTP.findOne({email});

        if(existingCustomer){
            return res.status(401).json({
                message: "Customer already exist",
                success: false
            })
        }

        if(prevOtp){
            await OTP.findOneAndDelete({email});
        }

        const otp = generateOtp();

        const createOtp = await OTP.create({email , otp});

        return res.status(200).json({
            message: "OTP sent successfully",
            success: true
        })


})



// SignUp Customer - with mongoose session
exports.signUp = asyncHandler(async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Destructure fields from the request body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            otpValue,
            mobileNumber,
        } = req.body.formData;





        // Check if all details are provided
        if (!firstName || !lastName || !email || !password || !confirmPassword || !otpValue) {
            return res.status(403).send({
                success: false,
                message: "All Fields are required",
            });
        }
        

        // Check if password and confirm password match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and Confirm Password do not match. Please try again.",
            });
        }


        // Check if customer already exists
        const existingCustomer = await Customer.findOne({ email }).session(session);
        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: "Customer already exists. Please sign in to continue.",
            });
        }


        // Verifying OTP
        const response = await OTP.findOne({ email }).session(session);
        if (!response) {
            return res.status(401).json({
                message: "OTP Not Found or OTP Expired",
                success: false
            });
        }

        if (response.otp !== Number(otpValue)) {
            return res.status(401).json({
                message: "Invalid OTP",
                success: false
            });
        }


        // Create customer
        const customer = await Customer.create([{
            firstName,
            lastName,
            email,
            password,
            mobileNumber,
        }], { session });


        // Send registration email
        try {
            const mailResponse = await mailSender(
                email,
                "Registration Successful",
                accountCreationEmail(firstName)
            );
            
        } catch (error) {
            console.log("Error occurred while sending email: ", error);
            throw error;
        }

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            customer: customer[0],
            message: "Registration successful",
        });

    } 
    catch (error) {
        // Abort the transaction and rollback any changes
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again.",
            error: error.message
        });
    }
});




// Login Customer
exports.customerLogin = async (req, res, next) => {
    
    passport.authenticate('customer-local', (err, user, info) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal Server Error1', error: err });
        }
        if (!user) {
            return res.status(401).json({ message: 'Authentication failed', error: info.message });
        }
        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Internal Server Error2', error: err });
            }
            return res.status(200).json({ message: 'Authentication successful', user });
        });
    })(req, res, next);
};









// Logout
exports.logout = async (req, res) => {

  req.logout((err) => {
    if (err) {
        return res.status(500).json({ message: 'Internal Server Error', error: err });
    }
    res.status(200).json({ message: 'Logout successful' });
  });

};










// SignUp Admin - with mongoose session
exports.signUpAdmin = asyncHandler(async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Destructure fields from the request body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            otp,
        } = req.body;


        // Check if all details are provided
        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(403).send({
                success: false,
                message: "All Fields are required",
            });
        }


        // Check if password and confirm password match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and Confirm Password do not match. Please try again.",
            });
        }


        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email }).session(session);
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Admin already exists. Please sign in to continue.",
            });
        }


        // Verifying OTP
        const response = await OTP.findOne({ email }).session(session);
        if (!response) {
            return res.status(401).json({
                message: "OTP Not Found or OTP Expired",
                success: false
            });
        }

        if (response.otp !== otp) {
            return res.status(401).json({
                message: "Invalid OTP",
                success: false
            });
        }


        // Create admin
        const admin = await Admin.create([{
            firstName,
            lastName,
            email,
            password,
        }], { session });



        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            admin: admin[0],
            message: "Registration successful",
        });

    } 
    catch (error) {
        // Abort the transaction and rollback any changes
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again.",
            error: error.message
        });
    }
});




// Login Admin
exports.adminLogin = async (req, res, next) => {
    passport.authenticate('admin-local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: 'Internal Server Error', error: err });
        }
        if (!user) {
            return res.status(401).json({ message: 'Authentication failed', error: info.message });
        }
        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Internal Server Error', error: err });
            }
            return res.status(200).json({ message: 'Authentication successful', user });
        });
    })(req, res, next);
};








// Load User Controller
exports.loadUser = async (req, res) => {
    
    if (req.isAuthenticated()) {
        return res.status(200).json({
            success: true,
            user: req.user
        });
    } else {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }
};
