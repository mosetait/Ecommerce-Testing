const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const Admin = require("../models/Admin");



exports.isAuth = async (req , res , next) => {

    try {
        
        const {token} = req.cookies;

        if(!token) {
            return res.status(401).json({
                message: "Please Login First",
                success: false
            })
        }

        
        

        // Verifying Token
        try {
            
            const decode = jwt.verify(token , process.env.JWT_SECRET);
     
            req.user = decode;

        } catch (error) {
            console.log(error)
            return res.status(401).json({ 
                success: false, 
                message: "token is invalid" 
            });

        }

        // If JWT is valid, move on to the next middleware or request handler
		next();

    } 
    catch (error) {
        console.log(error);
        return res.status(401).json({
			success: false,
			message: `Something Went Wrong While Validating the Token`,
		});
    }

}


// isAdmin
exports.isAdmin = async (req, res, next) => {
	try {
		const userDetails = await Admin.findOne({ email: req.user.email });

		if (!userDetails) {
			return res.status(401).json({
				success: false,
				message: "This is a Protected Route for Admin",
			});
		}

		next();

	} catch (error) {
        console.log(error)
		return res.status(500).json({ 
            success: false, 
            message: `User Role Can't be Verified` 
        });
	}
};



// isCustomer
exports.isCustomer = async (req, res, next) => {
	try {
		const userDetails = await Customer.findOne({ email: req.user.email });

		if (!userDetails) {
			return res.status(401).json({
				success: false,
				message: "This is a Protected Route for Customer",
			});
		}

		next();

	} catch (error) {
        console.log(error)
		return res.status(500).json({ 
            success: false, 
            message: `User Role Can't be Verified` 
        });
	}
};