    const asyncHandler = require("../../middlewares/asyncHandler");
    const Order = require("../../models/Order");
    const Cart = require("../../models/Cart");
    const Customer = require("../../models/Customer");
    const Payment = require("../../models/Payment"); // Import the Payment model
    const mailSender = require("../../utils/mailSender");
    const { orderPlacedEmail } = require("../../mailTemplate/OrderPlaced");
    const crypto = require("crypto")
    const axios = require("axios");


    function generateTransactionID() {
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000000 );
        const merchantPrefix = 'T';
        const transactionID = `${merchantPrefix}${timestamp}${randomNum}`
        return transactionID
    }


    exports.processPayment = asyncHandler(async (req, res) => {

        const { user, amount , items , deliveryAddress} = req.body.data;

        const transactionId = generateTransactionID();
        const data = {
            merchantId: process.env.PHONEPE_MERCHANT_ID,
            merchantTransactionId: transactionId ,
            merchantUserId: process.env.PHONEPE_MERCHANT_ID,
            name: user?.firstName,
            amount: amount * 100, // Ensure amount is multiplied correctly
            redirectUrl: `https://moseta.in/api/v1/backend/check-payment-status/${transactionId}`,
            redirectMode: 'POST',
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        };
        
        const payload = JSON.stringify(data);
        const payloadMain = Buffer.from(payload).toString('base64');
        const key = process.env.PHONEPE_KEY;
        const keyIndex = process.env.PHONEPE_KEY_INDEX;
        const string = payloadMain + '/pg/v1/pay' + key;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + "###" + keyIndex;
        
        const URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"; // Updated URL with the correct endpoint
        
        const options = {
            method: "POST",
            url: URL,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum 
            },
            data: {
                request: payloadMain
            }
        };



        try {
            const response = await axios.request(options);

            const customer = await Customer.findOne({_id: user._id});

            // Save payment details in the Payment model
            const payment = new Payment({
                customer: user._id,
                orderId: response.data.data.merchantTransactionId,
                amount: amount,
                currency: "INR",
                items,
                status: "created",
                deliveryAddress
            });
            await payment.save();

            customer.payments.push(payment._id);
            await customer.save();
            
            return res.status(200).send(response.data.data.instrumentResponse.redirectInfo.url);
        } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
            return res.status(400).send({
                error: error.response ? error.response.data : 'An error occurred'
            });
        }

    });




    exports.checkPaymentStatus = asyncHandler(async (req, res) => {

        const merchantTransctionId = res.req.body.transactionId;
        const merchantId = res.req.body.merchantId;
        const keyIndex = process.env.PHONEPE_KEY_INDEX;
        const key = process.env.PHONEPE_KEY ;
        const string = `/pg/v1/status/${merchantId}/${merchantTransctionId}` + key;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + "###" + keyIndex;

        const URL = `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransctionId}`;

        const options = {
            method: "GET",
            url: URL,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID' : merchantId
            }
        }


        // check payment status
        axios.request(options).then(async (response) => {

            const payment = await Payment.findOne({orderId: merchantTransctionId});
            const customer = await Customer.findOne({_id: payment.customer});
            const cart = await Cart.findOne({_id: customer.cart})

            payment.status = "captured";

            await payment.save();
            
            // Create new order
            const order = new Order({
                customer: payment.customer,
                orderItems: payment.items,
                paymentInfo: {
                    id: payment._id,
                    status: payment.status
                },
                totalPrice: payment.amount,
                paidAt: new Date(),
                shippingAddress: payment.deliveryAddress,
                paymentStatus: "paid",
                orderStatus: "processing"
            });
            await order.save();
            
            customer.orders.push(order._id);
            await customer.save();

            // Clear cart
            cart.items = [];
            await cart.save();


        // send complaint registration email
        try{
            await mailSender(
                customer.email , 
                "Order Placed",
                orderPlacedEmail(
                    customer.firstName,
                    payment.deliveryAddress,
                    payment.items,
                    payment.amount,
                    order.orderId
                )
            )
        }
        catch(error){
            throw Error(error);
        }

            const url = '/payment-success'
            return res.redirect(url)
        })
        .catch((error) => {
            console.log(error)
            const url = '/payment-failure'
            return res.redirect(url)
        })

    });



exports.cashOnDelivery = asyncHandler( async (req,res) => {

    const {amount,items,deliveryAddress} = req.body;

    if(!amount){
        return res.status(401).json({
            message: "Please select amount.",
            success: false
        })
    }

    if(!items){
        return res.status(401).json({
            message: "Please select order items.",
            success: false
        })
    }

    if(!deliveryAddress){
        return res.status(401).json({
            message: "Please select delivery address.",
            success: false
        })
    }

    const customer = await Customer.findOne({_id: req.user.id});
    const cart = await Cart.findOne({_id: customer.cart});

    // Create new order
    const order = new Order({
        customer: req.user.id,
        orderItems: items,
        totalPrice: amount,
        paymentInfo: {
            id: "NA",
            status: "Cash on delivery"
        },
        shippingAddress: deliveryAddress,
        paymentStatus: "Cash on delivery",
        orderStatus: "processing"
    });
    await order.save();
            
    customer.orders.push(order._id);
    await customer.save();

    // Clear cart
    cart.items = [];
    await cart.save();


    // send complaint registration email
    try{
        await mailSender(
            customer.email , 
            "Order Placed",
            orderPlacedEmail(
                customer.firstName,
                deliveryAddress,
                items,                    
                amount,
                order.orderId
            )
        )
    }
    catch(error){
        throw Error(error);
    }

    return res.status(200).json({
        message: "Order Placed Successfully",
        success: true
    })
    
})