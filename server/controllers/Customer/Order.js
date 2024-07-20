const asyncHandler = require("../../middlewares/asyncHandler");
const mongoose = require("mongoose");
const Customer = require("../../models/Customer");
const Order = require("../../models/Order");
const Payment = require("../../models/Payment");
const ErrorHandler = require("../../utils/errorHandler");



// create order after payment
// exports.createOrderAndPayment = asyncHandler(async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { sessionId, userId, orderProducts, totalPrice, deliveryAddress } = req.body;

//     const sessionDetails = await stripe.checkout.sessions.retrieve(sessionId);
//     if (!sessionDetails) {
//       throw new ErrorHandler("Session not found", 404);
//     }

//     const customer = await Customer.findById(userId).session(session);
//     if (!customer) {
//       throw new ErrorHandler("Customer not found", 404);
//     }

//     const paymentIntent = sessionDetails.payment_intent;
//     const paymentStatus = sessionDetails.payment_status;
//     const amountTotal = sessionDetails.amount_total;
//     const currency = sessionDetails.currency.toUpperCase();

//     const orderItems = orderProducts.map((product) => ({
//       product: product.product._id,
//       quantity: product.quantity,
//       price: product.price.$numberDecimal,
//     }));

//     const payment = new Payment({
//       customer: userId,
//       paymentId: paymentIntent,
//       signature: sessionDetails.id,
//       amount: amountTotal / 100, // Convert amount_total from paise to the currency's unit (e.g., rupees)
//       currency,
//       status: paymentStatus,
//     });

//     await payment.save({ session });

//     const order = new Order({
//       customer: userId,
//       orderItems,
//       paymentInfo: {
//         id: payment.paymentId,
//         status: payment.status,
//       },
//       totalPrice,
//       paidAt: new Date(),
//       shippingAddress: deliveryAddress,
//       paymentStatus: paymentStatus === "succeeded" ? "paid" : "pending",
//       orderStatus: "pending",
//     });

//     await order.save({ session });

//     customer.payments.push(payment._id);
//     customer.orders.push(order._id);
//     await customer.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({ success: true, message: "Order and Payment created successfully" });
//   } catch (error) {
//     console.error("Error creating order and payment:", error);

//     await session.abortTransaction();
//     session.endSession();

//     res.status(500).json({ success: false, error: error.message });
//   }
// });






// Get orders of a customer
exports.fetchCustomerOrders = asyncHandler(async (req, res) => {

  const orders = await Order.find({ customer: req.user.id })
    .populate({
      path: "orderItems.product",
    })
    .populate({
      path: "customer",
    })
    .populate({
      path: "discountCoupon",
    });

  return res.status(200).json({
    message: "Orders Fetched Successfully",
    orders,
    success: true,
  });
});

