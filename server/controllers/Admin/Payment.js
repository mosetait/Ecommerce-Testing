const Payment = require("../../models/Payment");
const asyncHandler = require("../../middlewares/asyncHandler");



exports.allPayments = asyncHandler( async (req,res) => {

    const payments = await Payment.find().sort({ createdAt: -1 })
    .populate("customer");


    return res.status(200).json({
        message: "Payments fetched successfully",
        success: false,
        payments
    })

})