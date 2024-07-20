const express = require("express");
const { fetchHeroCarousel, fetchDeals, fetchProductInfo, fetchCategoryProducts, searchProducts, fetchAllCategories } = require("../controllers/Common");
const router = express.Router();



// home Api
router.route("/backend/fetch-hero-carousel").get(fetchHeroCarousel);
router.route("/backend/fetch-deals").get(fetchDeals);


// product
router.route("/backend/fetch-product-info/:id").get(fetchProductInfo)
router.route("/backend/fetch-category-products/:id").get(fetchCategoryProducts)


// search
router.route("/backend/products/search").get(searchProducts);


// fetch all categories
router.route("/backend/fetch-categories").get(fetchAllCategories);


module.exports = router