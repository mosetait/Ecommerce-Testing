const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require('passport-google-oidc');
const Customer = require("../models/Customer");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");

exports.initializePassport = (passport) => {
    // Local Strategy for Customers
    passport.use('customer-local', new LocalStrategy(
        { usernameField: 'email', passwordField: 'password' }, // Specify field names
        async (email, password, done) => {
            try {
                const customer = await Customer.findOne({ email }).select("+password")
                    .populate({ path: "complaints" }).populate({ path: "repairRequests" })
                    .populate({path: "cart"});

                if (!customer) return done(null, false, { message: 'Incorrect email.' });

                // Check if the customer has a password set
                if (!customer.password) {
                    return done(null, false, { message: 'Invalid Credentials' });
                }

                const isPasswordMatched = await customer.comparePassword(password);
                if (!isPasswordMatched) return done(null, false, { message: 'Incorrect password.' });

                return done(null, customer);
            }
            catch (error) {
                return done(error, false);
            }
        }
    ));

    // Local Strategy for Admins
    passport.use('admin-local', new LocalStrategy(
        { usernameField: 'email', passwordField: 'password' }, // Specify field names
        async (email, password, done) => {
            try {
                const admin = await Admin.findOne({ email }).select("+password");
                if (!admin) return done(null, false, { message: 'Incorrect email.' });

                const isPasswordMatched = await admin.comparePassword(password);
                if (!isPasswordMatched) return done(null, false, { message: 'Incorrect password.' });

                return done(null, admin);
            }
            catch (error) {
                return done(error, false);
            }
        }
    ));

    // Google OIDC Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/v1/auth/google/callback"
    },
        async (issuer, profile, done) => {
            try {
                // Check if customer already exists
                let customer = await Customer.findOne({
                    $or: [
                        { googleId: profile.id },
                        { email: profile.emails[0].value }
                    ]
                })
                    .populate({ path: "complaints" }).populate({ path: "repairRequests" });

                if (customer) {
                    customer.googleId = profile.id;
                    await customer.save();
                    return done(null, customer)
                };

                // If not, create a new customer
                customer = new Customer({
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    firstName: profile.name.givenName,
                    lastName: profile.name?.familyName || ''
                });

                await customer.save();

                return done(null, customer);
            }
            catch (error) {
                console.log(error)
                return done(error, false);
            }
        }));

    // Serialize and Deserialize
    passport.serializeUser((user, done) => {
        done(null, { id: user.id, type: user instanceof Customer ? 'Customer' : 'Admin' });
    });

    passport.deserializeUser(async (obj, done) => {
        try {
            if (obj.type === 'Customer') {
                const customer = await Customer.findById(obj.id)
                    .populate({ path: "complaints" , populate: {path: "product"} })
                    .populate({ path: "repairRequests" , populate: {path: "product"} })
                    .populate({path: "cart"});
                done(null, customer);
            } else {
                const admin = await Admin.findById(obj.id);
                done(null, admin);
            }
        } catch (error) {
            done(error, null);
        }
    });
};

// Middleware to check authentication
exports.isAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
}

// Middleware to check admin
exports.isAdmin = (req, res, next) => {
    if (req.user.role === "admin") {
        return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
}

// Middleware to check customer
exports.isCustomer = (req, res, next) => {
    if (req.user.role === "customer") {
        return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
}

// Load User Controller
exports.loadUser = async (req, res) => {
    if (req.isAuthenticated()) {
        console.log(req.user)
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
