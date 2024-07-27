const express = require("express");
const router = express.Router();
const passport = require("passport");
const { sendOtp, signUp, customerLogin, adminLogin, logout, signUpAdmin, loadUser } = require("../controllers/Auth");
const { isAuth } = require("../middlewares/auth");
const jwt  = require("jsonwebtoken")

// Google OAuth login route
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback route
router.get('/auth/google/callback',
    passport.authenticate('google', { session: false }), // Ensure no session is created
    async (req, res) => {
    
        try {
            if (req.user) {

                const token = jwt.sign(
                    {
                      email: req.user.customer.email,
                      id: req.user.customer._id,
                      role: req.user.customer.role,
                    },
                    process.env.JWT_SECRET,
                    {
                      expiresIn: '72h',
                    }
                  );
            
        
                  req.user.token = token;
                  req.user.password = undefined;
            

                  const options = {
                    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                    httpOnly: true,
                    sameSite: 'None', // Adjust based on your application's needs
                    secure: true, // Set to true in production if served over HTTPS
                  };

                res.cookie('token', token, options);
                res.redirect('http://localhost:5173/'); // Redirect to your frontend
            } else {
                res.redirect('http://localhost:5173/login'); // Redirect to login if authentication fails
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);


// OTP and Registration routes
router.route("/backend/send-otp").post(sendOtp);
router.route("/backend/register").post(signUp);

// Customer login
router.post('/backend/login/customer', customerLogin);

// Admin routes
router.route("/backend/sign-up-admin").post(signUpAdmin);
router.post('/backend/login/admin', adminLogin);

router.route("/backend/load-user").get( isAuth , loadUser)

// Logout route
router.route("/backend/logout").post(logout);

module.exports = router;
