const Order = require("../../models/Order");
const Product = require("../../models/Product");
const Customer = require("../../models/Customer");
const asyncHandler = require("../../middlewares/asyncHandler");



// fetching data for dashboard
exports.dashboardData = asyncHandler( async (req,res) => {

    const orders = await Order.find();
    const products = await Product.find();
    const customers = await Customer.find();

    res.status(200).json({
        message: "Main Data fetched successfully",
        success: true,
        orders,
        products,
        customers,
    })

})



// fetch all orders
exports.allOrders = asyncHandler( async (req,res) => {

    const orders = await Order.find().sort({ createdAt: -1 });

    res.status(200).json({
        message: "Main Data fetched successfully",
        success: true,
        orders,
    })

})


// fetch single order
exports.orderDetails = asyncHandler( async (req,res) => {

    const {id} = req.params;

    const order = await Order.findOne({ _id: id })
      .populate('customer')
      .populate('orderItems.product')
      .populate('discountCoupon');

    if(!order){
        return res.status(404).json({
            message: "Order Not Found",
            success: false
        })
    }

    res.status(200).json({
        message: "Order details successfully",
        success: true,
        order,
    })

})