const Product = require('../../models/Product');
const ErrorHandler = require('../../utils/errorHandler');
const asyncHandler = require('../../middlewares/asyncHandler');
const RatingReview = require("../../models/RatingReview");
const Customer = require("../../models/Customer")


// Create OR Update Reviews
exports.createProductReview = asyncHandler(async (req, res, next) => {
    const { rating, review, productId } = req.body.newReview;
  
  
    if (!rating || !review || !productId) {
      return next(new ErrorHandler("Please provide all required information", 401));
    }
  
    try {
      const product = await Product.findById(productId).populate({ path: "reviews" });
  
      if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
      }
  
      // Find if the user already reviewed the product
      const isReviewed = product.reviews.find(
        (rev) => rev.customer.toString() === req.user._id.toString()
      );
  
      let reviewDocument;
  
      if (isReviewed) {
        // Update existing review
        reviewDocument = await RatingReview.findByIdAndUpdate(
          { _id: String(isReviewed._id) },
          { rating, review },
          { new: true } // Return the updated document
        ).populate('customer product');
      } else {
        // Create new review
        reviewDocument = await RatingReview.create({
          customer: req.user._id,
          rating: rating,
          review: review,
          product: productId,
        });
  
        product.reviews.push(reviewDocument._id);
        product.numOfReviews = product.reviews.length;
  
        // Push the new review to the customer's ratingAndReview array
        const customer = await Customer.findById(req.user._id);
        customer.ratingAndReview.push(reviewDocument._id);
        await customer.save();
        await product.save();
  
        reviewDocument = await reviewDocument.populate('customer product');
      }
  
      res.status(200).json({
        success: true,
        product, // Optionally send back the updated product
        review: reviewDocument // Send back the review with populated fields
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  });
  
  





