const asyncHandler = require("../../middlewares/asyncHandler");
const ErrorHandler = require("../../utils/errorHandler");
const Customer = require("../../models/Customer");
const mongoose = require("mongoose")
const Cart = require("../../models/Cart");
const Order = require("../../models/Order");
const RatingReview = require("../../models/RatingReview");
const Complaint = require("../../models/Complaint");
const RepairRequest = require("../../models/RepairRequest");
const Product = require("../../models/Product");





// block / unblock customer account
exports.blockUnblockCustomerAccount = asyncHandler( async (req,res,next) => {
    
    const {customerId} = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    const customer = await Customer.findOne({_id: customerId});

    if(!customer){
        return next (new ErrorHandler("Customer Not Found",404));
    }

    await customer.updateOne({approved: !customer.approved});

    // Fetch the updated customer document
    const updatedCustomer = await Customer.findOne({_id: customerId});

    return res.status(200).json({
        message: `Account ${updatedCustomer.approved ? 'Blocked' : 'Unblocked'} Successfully`,
        success: true,
        customer: updatedCustomer
    })
})






// Delete Customer
exports.deleteCustomer = asyncHandler(async (req, res, next) => {
    
    const { id } = req.params;
    
    // Validate input
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const customer = await Customer.findById(id).session(session);

        if (!customer) {
            throw new ErrorHandler("Customer Not Found", 404);
        }

        // Find and delete cart
        const cart = await Cart.findById(customer.cart).session(session);
        if (cart) {
            await cart.deleteOne({ session });
        }

        // Delete orders
        await Order.deleteMany({ customer: id }).session(session);

        // Fetch and delete reviews
        const reviews = await RatingReview.find({ customer: id }).session(session);
        for (const review of reviews) {
            const product = await Product.findById(review.product).populate('reviews').session(session);
            if (product) {
                product.reviews = product.reviews.filter(reviewId => !reviewId.equals(review._id));
                product.numOfReviews = product.reviews.length;
                product.ratings = product.reviews.length ? product.reviews.reduce((acc, cur) => acc + cur.rating, 0) / product.reviews.length : 0;
                await product.save({ session });
            }
            await RatingReview.deleteOne({ _id: review._id }).session(session);
        }

        // Delete complaints
        await Complaint.deleteMany({ customer: id }).session(session);

        // Delete repair requests
        await RepairRequest.deleteMany({ user: id }).session(session);

        // Finally, delete the customer
        await customer.deleteOne({ session });

        // Fetch remaining customers
        const remainingCustomers = await Customer.find().session(session);

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ 
            message: 'Customer and related data deleted successfully',
            customers: remainingCustomers
        });
        
    } catch (error) {
        console.log(error)
        await session.abortTransaction();
        session.endSession();
        next(new ErrorHandler(error.message || "Internal Server Error", 500));
    }
});





// get all customers
exports.allCustomers = asyncHandler( async (req,res) => {

    const customers = await Customer.find().sort({ createdAt: -1 });

    return res.status(200).json({
        message: "Customers fetched successfully",
        customers,
        success: true
    })

})



// single customer
exports.singleCustomer = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const customer = await Customer.findById(id)
        .populate({
            path: 'cart',
            populate: {
                path: 'items.product',
                model: 'Product'
            }
        })
        .populate('orders')
        .populate('payments')
        .populate('ratingAndReview')
        .populate({
            path: 'complaints',
            populate: {
                path: 'product',
                model: 'Product'
            }
        })
        .populate({
            path: 'repairRequests',
            populate: {
                path: 'product',
                model: 'Product'
            }
        });

    if (!customer) {
        return res.status(404).json({
            message: "Customer not found",
            success: false
        });
    }

    return res.status(200).json({
        message: "Customer fetched successfully",
        customer,
        success: true
    });
});