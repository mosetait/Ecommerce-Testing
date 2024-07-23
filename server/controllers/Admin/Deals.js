const Product = require("../../models/Product")
const Deals = require("../../models/Deals")
const asyncHandler = require("../../middlewares/asyncHandler");
const ErrorHandler = require("../../utils/errorHandler");
const Category = require("../../models/Category");




// create new Deals schema
exports.createDealDocument = asyncHandler( async (req,res) => {

    const deal = await Deals.create({
        bestDeal: [],
        mostPopular: [],
        newest: []
    });

    return res.status(200).json({
        message: "Model created successfully",
        success: true,
        deal
    })

})



// Add product to deals
exports.addProductsToDeal = asyncHandler(async (req, res, next) => {

    const { dealName, products } = req.body.updatedProduct;

    // Validate request
    if (!dealName || !products) {
        return next(new ErrorHandler("Provide deal name and products.", 400));
    }

    // Validate deal name
    const validDealNames = ["bestDeal", "mostPopular", "newest"];
    if (!validDealNames.includes(dealName)) {
        return next(new ErrorHandler("Invalid deal name provided.", 400));
    }

    // Fetch deals (assuming there's only one deals document)
    const deals = await Deals.findOne();
    if (!deals) {
        return next(new ErrorHandler("Deals not found.", 404));
    }

    // Add products to the specified deal
    products.forEach(product => {
        if (!deals[dealName].includes(product)) {
            deals[dealName].push(product);
        }
    });

    // Save the updated deals document
    await deals.save();


    const updatedDeals = await Deals.findOne()
    .populate({path: "mostPopular"})
    .populate({path: "bestDeal"})
    .populate({path: "newest"})



    // Respond with success
    return res.status(200).json({
        success: true,
        message: `Products added to ${dealName}`,
        deals: updatedDeals
    });
});




// fetch deals
exports.fetchDeals = asyncHandler( async (req,res) => {


    const deals = await Deals.findOne().sort({ createdAt: -1 })
    .populate({path: "mostPopular"})
    .populate({path: "bestDeal"})
    .populate({path: "newest"})


    const categories = await Category.find()
    .populate({
        path: 'products',
        model: 'Product'
    })
    .populate({
        path: 'subCategories',
        model: 'SubCategory',
        populate: {
            path: 'products',
            model: 'Product'
        }
    });

    return res.status(200).json({
        message: "Deals fetched successfully",
        success: true,
        deals,
        categories
    })


})




// Remove product from deals
exports.removeProductFromDeal = asyncHandler(async (req, res, next) => {
    const { dealName, productId } = req.body;

    // Validate request
    if (!dealName || !productId) {
        return next(new ErrorHandler("Provide deal name and product ID.", 400));
    }

    // Validate deal name
    const validDealNames = ["bestDeal", "mostPopular", "newest"];
    if (!validDealNames.includes(dealName)) {
        return next(new ErrorHandler("Invalid deal name provided.", 400));
    }

    // Fetch deals (assuming there's only one deals document)
    const deals = await Deals.findOne();
    if (!deals) {
        return next(new ErrorHandler("Deals not found.", 404));
    }

    // Remove product from the specified deal
    deals[dealName] = deals[dealName].filter(product => !product.equals(productId));

    // Save the updated deals document
    await deals.save();

    const updatedDeals = await Deals.findOne()
    .populate({path: "mostPopular"})
    .populate({path: "bestDeal"})
    .populate({path: "newest"})


    // Respond with success
    return res.status(200).json({
        success: true,
        message: `Product removed from ${dealName}`,
        deals: updatedDeals
    });
});