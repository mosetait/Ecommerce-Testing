const asyncHandler = require("../middlewares/asyncHandler");
const Customer = require("../models/Customer");
const Admin = require("../models/Admin");
const OTP = require("../models/OTP");
const passport = require("passport")
const Cart = require("../models/Cart");
const { accountCreationEmail } = require("../mailTemplate/accountCreation");
const mailSender = require("../utils/mailSender");
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const validator = require("validator")
const bcrypt = require("bcrypt");

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
    
    try {

        const { email, password } = req.body;
    
        if (!validator.isEmail(email) || !password) {
          return res.status(401).json({
            message: 'Please provide a valid Email and Password',
            success: false,
          });
        }
    
        const user = await Customer.findOne({email}).select("+password")
        .populate({ path: "complaints" , populate: {path: "product"} })
        .populate({ path: "repairRequests" , populate: {path: "product"} })
        .populate({path: "cart"});
    
        if (!user) {
          return res.status(404).json({
            message: 'Invalid Email or Password',
            success: false,
          });
        }
    
        if (await bcrypt.compare(password, user.password)) {
  
          const token = jwt.sign(
            {
              email: user.email,
              id: user._id,
              role: user.role,
            },
            process.env.JWT_SECRET,
            {
              expiresIn: '72h',
            }
          );
    

          user.token = token;
          user.password = undefined;
    
          const options = {
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            sameSite: 'None', // Adjust based on your application's needs
            secure: true, // Set to true in production if served over HTTPS
          };
    
          res.cookie('token', token, options).status(200).json({
            message: 'Logged in successfully',
            success: true,
            token,
            user,
          });
  
        } 
        else {
          return res.status(401).json({
            success: false,
            message: 'Invalid Email or Password',
          });
        }
      } 
      catch (error) {
        console.error(error);
        return res.status(500).json({
          success: false,
          message: 'Login failure, please try again',
        });
      }

};









// Logout
exports.logout = async (req, res) => {

  try {

    let { token } = req.cookies;

    if (token !== "") {
      // Clear the 'token' cookie
      res.clearCookie('token');

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } 
    else {
      return res.status(200).json({
        success: false,
        message: 'You are already logged out.',
      });
    }
  } 
  catch (error) {
    console.log(error);
    return res.status(401).json({
      message: 'Error while logging out',
      success: false,
    });
  }
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

    try {

        const { email, password } = req.body;
    
        if (!validator.isEmail(email) || !password) {
          return res.status(401).json({
            message: 'Please provide a valid Email and Password',
            success: false,
          });
        }
    
        const user = await Admin.findOne({email}).select("+password")
    
        if (!user) {
          return res.status(404).json({
            message: 'Invalid Email or Password',
            success: false,
          });
        }
    
        if (await bcrypt.compare(password, user.password)) {
  
          const token = jwt.sign(
            {
              email: user.email,
              id: user._id,
              role: user.role,
            },
            process.env.JWT_SECRET,
            {
              expiresIn: '72h',
            }
          );
    
          user.token = token;
          user.password = undefined;
    
          const options = {
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            sameSite: 'None', // Adjust based on your application's needs
            secure: true, // Set to true in production if served over HTTPS
          };
    
          res.cookie('token', token, options).status(200).json({
            message: 'Logged in successfully',
            success: true,
            token,
            user,
          });
  
        } 
        else {
          return res.status(401).json({
            success: false,
            message: 'Invalid Email or Password',
          });
        }
      } 
      catch (error) {
        console.error(error);
        return res.status(500).json({
          success: false,
          message: 'Login failure, please try again',
        });
      }

};








// Load User Controller
exports.loadUser = async (req, res) => {
    
  try {

    const { id , role } = req.user; // Assuming the user ID is stored in the token payload
    let user;

    if(role == "admin"){
        user = await Admin.findById(id).select('-password'); 
    }
    else if (role == "customer"){
        user = await Customer.findById(id).select('-password'); 
    }
    else{
        return res.status(401).json({
            message: "Invalid Role",
            success: false
        })
    }



    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${role == 'customer' ? 'customer' : 'admin' } is not found`,
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error getting user information',
    });
  }

};
