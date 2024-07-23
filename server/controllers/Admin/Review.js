const Product = require('../../models/Product');
const ErrorHandler = require('../../utils/errorHandler');
const asyncHandler = require('../../middlewares/asyncHandler');
const RatingReview = require("../../models/RatingReview");
const Customer = require("../../models/Customer");





// Approve a review
exports.approveReview = asyncHandler(async (req, res, next) => {
    
    const { reviewId } = req.body;

    if (!reviewId) {
        return next(new ErrorHandler("Please provide review id", 401));
    }

    // Find review
    const review = await RatingReview.findById(reviewId);

    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }

    // Find product
    const product = await Product.findById(review.product).populate('reviews');

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    
    // Approve review
    review.allowed = true;
    await review.save();


    // Re-populate the reviews to include the newly approved review
    await product.populate('reviews');


    // Calculate average rating
    let totalRating = 0;
    const approvedReviews = product.reviews.filter(rev => rev.allowed);
    
    approvedReviews.forEach((rev) => {
        totalRating += rev.rating;
    });

    product.ratings = approvedReviews.length > 0 ? totalRating / approvedReviews.length : 0;
    product.numOfReviews = approvedReviews.length;

    // Save the product
    await product.save();

    return res.status(200).json({
        message: "Review Approved Successfully",
        success: true,
    });
});






// Delete Review
exports.deleteReview = asyncHandler(async (req, res, next) => {

    const { id } = req.params;

    if (!id) {
        return next(new ErrorHandler("Please provide review id", 401));
    }

    // Find review
    const review = await RatingReview.findById(id);

    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }

    // Find product
    const product = await Product.findById(review.product).populate('reviews');

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
console.log(review);
    // Find customer
    const customer = await Customer.findById(review.customer);

    if (!customer) {
        return next(new ErrorHandler("Customer not found", 404));
    }

    // Remove review id from customer and product
    customer.ratingAndReview = customer.ratingAndReview.filter((rev) => rev.toString() !== id.toString());
    product.reviews = product.reviews.filter((rev) => rev._id.toString() !== id.toString());


    await customer.save();


    // Delete review
    await review.deleteOne();

    // Recalculate ratings
    let totalRating = 0;
    const approvedReviews = product.reviews.filter(rev => rev.allowed);
    approvedReviews.forEach((rev) => {
        totalRating += rev.rating;
    });

    product.ratings = approvedReviews.length > 0 ? totalRating / approvedReviews.length : 0;
    product.numOfReviews = approvedReviews.length;

    // Save the product
    await product.save();

    const reviews = await RatingReview.find()
    .populate("customer")
    .populate("product")

    return res.status(200).json({
        message: "Review Deleted Successfully",
        success: true,
        reviews
    });
});





// get all reviews
exports.allReviews = asyncHandler( async (req,res) => {


    const reviews = await RatingReview.find().sort({ createdAt: -1 })
    .populate("customer")
    .populate("product")


    return res.status(200).json({
        message: "Reviews fetched successfully",
        success: true,
        reviews
    })


})
