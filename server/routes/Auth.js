const express = require("express");
const router = express.Router();
const passport = require("passport");
const { sendOtp, signUp, customerLogin, adminLogin, logout, signUpAdmin, loadUser } = require("../controllers/Auth");



router.route("/send-otp").post(sendOtp);
router.route("/register").post(signUp);



router.post('/login/customer', customerLogin);
router.route("/logout").post(logout);





// Google OAuth login route
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback route
router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }),
    (req, res) => {
        // Successful authentication
        res.redirect('http://localhost:5173/'); 
    }
);





// admin auth
router.route("/sign-up-admin").post(signUpAdmin);

// Admin login route
router.post('/login/admin', adminLogin);


// load user
router.get("/load-user" , loadUser)


module.exports = router