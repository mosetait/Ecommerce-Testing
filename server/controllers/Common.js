const asyncHandler = require("../middlewares/asyncHandler");
const Carousel = require("../models/Carousel")
const Deals = require("../models/Deals");
const Product = require("../models/Product");
const Category = require("../models/Category");
const mongoose = require('mongoose');
const SearchFeatures = require('../utils/searchFeatures');




// Home Page API

// fetch carousel
exports.fetchHeroCarousel = asyncHandler( async (req,res) => {

    const carousel = await Carousel.findOne({title: "Hero Section Carousel"});

    return res.status(200).json({
        carousel,
    })

})



// fetch deals
exports.fetchDeals = asyncHandler( async (req,res) => {


    const deals = await Deals.find()
    .populate({path: "bestDeal"})
    .populate({path: "mostPopular"})
    .populate({path: "newest"})


    return res.status(200).json({
        deals: deals[0]
    })

})








// Fetch Product Info
exports.fetchProductInfo = asyncHandler( async (req,res) => {

    const {id} = req.params;

    // Check if id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid category id."
        });
    }

    if(!id){
        return res.status(401).json({
            message: "Please provide productId",
            success: false
        })
    }

    const product = await Product.findOne({_id: id}).populate({path: "reviews" , populate: {path: "customer"}});

    if(!product){
        return res.status(404).json({
            message: "Product Not Found.",
            success: false
        })
    }

    return res.status(200).json({
        product,
        success: true
    })
})



// fetch products of a single category
exports.fetchCategoryProducts = asyncHandler(async (req, res) => {

    const { id } = req.params;

    // Check if id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid category id."
        });
    }

    const category = await Category.findOne({ _id: id })
        .populate({ path: "products" })
        .populate({ path: "subCategories", populate: { path: "products" } });

    if (!category) {
        return res.status(404).json({
            success: false,
            message: "Category not found."
        });
    }

    return res.status(200).json({
        success: true,
        category
    });
});


// fetch all categories
exports.fetchAllCategories = asyncHandler( async (req,res) => {

    const categories = await Category.find()
    .populate({path: "products"})
    .populate ({path : "subCategories" , populate : {path: "products"} })


    return res.status(200).json({
        message: "Categories fetched successfully",
        categories,
        success: true
    })

})




exports.searchProducts = async (req, res) => {
    try {
        const productsQuery = new SearchFeatures(Product.find(), req.query)
            .search()

        const products = await productsQuery.query;

        res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
