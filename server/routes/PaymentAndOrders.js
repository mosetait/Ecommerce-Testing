const express = require("express");
const { processPayment, checkPaymentStatus, cashOnDelivery } = require("../controllers/Customer/Payment");
const { createOrderAndPayment, fetchCustomerOrders } = require("../controllers/Customer/Order");
const { isAuth, isCustomer } = require("../middlewares/auth");
const router = express.Router();



router.route("/backend/create-checkout-session").post(isAuth , isCustomer, processPayment)


router.route("/backend/check-payment-status/:paymentId").post(isAuth , isCustomer, checkPaymentStatus)

// router.route("/create-order").post(isAuth, isCustomer,createOrderAndPayment)


router.route("/backend/fetch-orders").get(isAuth, isCustomer, fetchCustomerOrders );


router.route("/backend/order-cash-on-delivery").post(isAuth, isCustomer, cashOnDelivery );



module.exports = router