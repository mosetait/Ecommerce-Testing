const Order = require("../../models/Order");
const Customer = require("../../models/Customer");
const asyncHandler = require("../../middlewares/asyncHandler");
const ErrorHandler = require("../../utils/errorHandler");
const mongoose = require("mongoose");




// update order status
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
    const { orderId, status } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return next(new ErrorHandler("Invalid input data", 400));
    }

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
        return next(new ErrorHandler("Please provide a valid status", 401));
    }

    const order = await Order.findByIdAndUpdate(
        orderId,
        { orderStatus: status },
        { new: true, runValidators: true }
    )
    .populate("customer")
    .populate({
        path: "orderItems.product",
        model: "Product"
    })
    .populate("discountCoupon");

    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    return res.status(200).json({
        message: "Order status updated successfully",
        success: true,
        order
    });
});



// delete order
