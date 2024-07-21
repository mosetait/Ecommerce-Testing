const GoogleStrategy = require('passport-google-oidc');
const Customer = require("../models/Customer");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // If needed for other operations

exports.initializePassport = (passport) => {
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
                    .populate({ path: "complaints" })
                    .populate({ path: "repairRequests" });

                if (customer) {
                    customer.googleId = profile.id;
                    await customer.save();
                } else {
                    // Create a new customer if not found
                    customer = new Customer({
                        googleId: profile.id,
                        email: profile.emails[0].value,
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName || ''
                    });
                    await customer.save();
                }

                // Generate JWT token
                const token = jwt.sign(
                    {
                        email: customer.email,
                        id: customer._id,
                        role: 'Customer', // Assuming role is 'Customer' for Google Auth
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: '72h',
                    }
                );

                // Set token as cookie
                const options = {
                    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                    httpOnly: true,
                    sameSite: 'None', // Adjust based on your application's needs
                    secure: true, // Set to true in production if served over HTTPS
                };

                // Pass token to callback
                done(null, { token, customer });

            } catch (error) {
                console.log(error);
                done(error, false);
            }
        }
    ));

    passport.serializeUser((user, done) => {
        done(null, { id: user.id, type: 'Customer' });
    });

    passport.deserializeUser(async (obj, done) => {
        try {
            const customer = await Customer.findById(obj.id)
                .populate({ path: "complaints", populate: { path: "product" } })
                .populate({ path: "repairRequests", populate: { path: "product" } })
                .populate({ path: "cart" });
            done(null, customer);
        } catch (error) {
            done(error, null);
        }
    });
};
