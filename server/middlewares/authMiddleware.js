const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const asyncHandler = require("../middlewares/asyncHandler");

const Customer = require("../models/Customer");
const Admin  = require("../models/Admin");
const { ErrorResponse } = require("./error");

const protectCustomer = asyncHandler(async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Get token from header
    const token = req.headers.authorization.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const user = await Customer.findById(decoded.id).select("-password");

    if (!user) {
      throw new ErrorResponse("User does not exist", StatusCodes.BAD_REQUEST);
    }

    req.user = user;

    next();
  } else {
    throw new ErrorResponse("Not authenticated", StatusCodes.UNAUTHORIZED);
  }
});

const protectAdmin = asyncHandler(async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Get token from header
    const token = req.headers.authorization.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const user = await Admin.findById(decoded.id).select("-password");

    if (!user) {
      throw new ErrorResponse("Admin does not exist", StatusCodes.BAD_REQUEST);
    }

    req.user = user;

    next();
  } else {
    throw new ErrorResponse("Not authenticated", StatusCodes.UNAUTHORIZED);
  }
});


module.exports = { protectCustomer , protectAdmin};
