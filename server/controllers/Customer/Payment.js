    const asyncHandler = require("../../middlewares/asyncHandler");
    const Razorpay = require("razorpay");
    const Order = require("../../models/Order");
    const Cart = require("../../models/Cart");
    const Customer = require("../../models/Customer");
    const Payment = require("../../models/Payment"); // Import the Payment model
const mailSender = require("../../utils/mailSender");
const { orderPlacedEmail } = require("../../mailTemplate/OrderPlaced");


exports.processPayment = asyncHandler(async (req, res) => {
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const { amount, items, user, deliveryAddress } = req.body;

    const options = {
        amount: amount * 100, // Razorpay requires the amount in paise
        currency: "INR",
        receipt: `receipt#${new Date().getTime()}`,
        payment_capture: 1
    };

    try {
        const response = await razorpay.orders.create(options);

        // Save payment details in the Payment model
        const payment = new Payment({
            customer: user._id,
            orderId: response.id,
            amount: amount,
            currency: "INR",
            status: "created"
        });
        await payment.save();

        res.json({
            order_id: response.id,
            currency: response.currency,
            amount: response.amount,
            items: items,
            user: user,
            deliveryAddress: deliveryAddress
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
    });




exports.checkPaymentStatus = asyncHandler(async (req, res) => {

    const { paymentId, signature, deliveryAddress } = req.body;
    const userId = req.user._id;

    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    try {
        const payment = await razorpay.payments.fetch(paymentId);

        if (!payment) {
            return res.status(500).json("Error At Razorpay loading");
        }

        if (payment.status === "captured") {
            const cart = await Cart.findOne({ customer: userId }).populate('items.product');

            // Create new newOrder
            const newOrder = new Order({
                customer: userId,
                orderItems: cart.items.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity,
                    price: item.price
                })),
                paymentInfo: {
                    id: paymentId,
                    status: payment.status
                },
                totalPrice: cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0),
                paidAt: new Date(),
                shippingAddress: deliveryAddress,
                paymentStatus: "paid",
                orderStatus: "processing"
            });
            await newOrder.save();


            // Emit the new newOrder form event
            const io = req.app.get('io');
            io.emit('newOrder', newOrder);


            // Update the Payment model
            await Payment.findOneAndUpdate(
                { orderId: payment.order_id },
                { status: payment.status, signature: signature, paymentId: paymentId }
            );

            // Add newOrder to customer
            const customer = await Customer.findOne({ _id: userId });
            customer.orders.push(newOrder._id);
            await customer.save();

            // Clear cart
            cart.items = [];
            await cart.save();



            // send mail to customer
            try {
                const mailResponse = await mailSender(
                    customer.email,
                    "Order Completion",
                    orderPlacedEmail({  
                        name: customer.firstName , 
                        shippingInfo: deliveryAddress ,
                        orderId: newOrder.orderId
                    })
                );
                
            } catch (error) {
                console.log("Error occurred while sending email: ", error);
                throw error;
            }

            return res.json({
                status: payment.status,
                method: payment.method,
                amount: payment.amount,
                currency: payment.currency,
                orderId: newOrder._id
            });
        } else {
            return res.json({
                status: payment.status,
                method: payment.method,
                amount: payment.amount,
                currency: payment.currency
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json("Failed to fetch payment.");
    }
});