const Customer = require("../../models/Customer");
const Cart = require("../../models/Cart");
const Complaint = require("../../models/Complaint");
const Category = require("../../models/Category");
const ContactUs = require("../../models/ContactUs");
const DiscountCoupon = require("../../models/DiscountCoupon");
const Notification = require("../../models/Notification");
const Order = require("../../models/Order");
const Payment = require("../../models/Payment");
const Product = require("../../models/Product");
const RatingReview = require("../../models/RatingReview");
const RepairRequest = require("../../models/RepairRequest");
const SubCategory = require("../../models/SubCategory");
const Technician = require("../../models/Technician");
const asyncHandler = require("../../middlewares/asyncHandler");
const SearchFeatures = require("../../utils/searchFeatures");
const ErrorHandler = require("../../utils/errorHandler");
const Deals = require("../../models/Deals")
const mongoose = require("mongoose")



// ---------------- CUSTOMER -------------------

// Get All Customer --ADMIN
exports.getAllCustomers = asyncHandler(async (req, res, next) => {

    const customers = await Customer.find().sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        customers,
    });

});




// Get Single Customer Details --ADMIN
exports.getSingleCustomer = asyncHandler(async (req, res, next) => {

    const customerId = req.params.id;

    if(!mongoose.Types.ObjectId.isValid(customerId)){
        return next (new ErrorHandler("Provide Valid Customer Id."),401);
    }

    if(!customerId){
        return next (new ErrorHandler("Provide Customer Id."));
    }

    const customer = await Customer.findById({ _id: customerId })
    .populate({
        path: "cart",
        populate: {
            path: "items.product",
            model: "Product"
        }
    })
    .populate({ path: "orders" })
    .populate({ path: "ratingAndReview" })
    .populate({ path: "complaints" })
    .populate({ path: "repairRequests" });


    if(!customer) {
        return next(new ErrorHandler(`User doesn't exist with id: ${req.params.id}`, 404));
    }

    return res.status(200).json({
        success: true,
        customer,
    });
});






// ---------------- PRODUCT -------------------


// Get All Products
exports.getAllProducts = asyncHandler(async (req, res, next) => {

    const resultPerPage = 12;

    const productsCount = await Product.countDocuments();
    // console.log(req.query);

    const searchFeature = new SearchFeatures(Product.find({status: "Published"})
    .populate({path: "category"}).populate({path: "subCategory"}), req.query)
        .search()
        .filter();

    let products = await searchFeature.query;
    let filteredProductsCount = products.length;

    searchFeature.pagination(resultPerPage);

    products = await searchFeature.query.clone();

    const deals = await Deals.findOne()
    .populate({path: "mostPopular"})
    .populate({path: "bestDeal"})
    .populate({path: "newest"})

    res.status(200).json({
        success: true,
        products,
        productsCount,
        resultPerPage,
        filteredProductsCount,
        deals
    });
});





// Get Product Details
exports.getProductDetails = asyncHandler(async (req, res, next) => {

    const productId = req.params.id;

    if(!productId){
        return next (ErrorHandler("Provide Product Id" , 401));
    }

    const product = await Product.findById(req.params.id)
    .populate({path: "category"})
    .populate({path: "subCategory"});

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    return res.status(200).json({
        success: true,
        product,
    });
});






// Get All Products ---ADMIN
exports.getAdminProducts = asyncHandler(async (req, res, next) => {
    const products = await Product.find();

    res.status(200).json({
        success: true,
        products,
    });
});