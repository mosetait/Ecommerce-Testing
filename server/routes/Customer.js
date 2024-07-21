const express = require("express");
const { isAuth, isCustomer } = require("../middlewares/auth");
const { contactUs, registerComplaint, fetchSingleComplaint, repairRequest, fetchSingleRequest, popupForm } = require("../controllers/ContactUs");
const { createProductReview } = require("../controllers/Customer/Review");
const { addToCart, deleteFromCart, increaseQuantity, decreaseQuantity, fetchCustomerCart } = require("../controllers/Customer/Cart");
const { forgotPassword, resetPassword, updatePassword, updateProfile } = require("../controllers/Customer/Updation");
const { getAllProducts, getProductDetails } = require("../controllers/Admin/getControllers");
const { addAddress, editAddress, deleteAddress } = require("../controllers/Customer/Address");
const { fetchComplaints, fetchRequests } = require("../controllers/Customer/getControllers");
const router = express.Router();




// forgot password
router.route("/backend/forgot-password-customer").post(forgotPassword);

// reset password
router.route("/backend/password/reset/:token").put(resetPassword);

// update password
router.route("/backend/update-password-customer").put(isAuth , isCustomer ,updatePassword);

// update profile
router.route("/backend/update-customer-profile").put(isAuth , isCustomer , updateProfile);



// complaint
router.route("/backend/register-complaint").post(isAuth, isCustomer, registerComplaint);
router.route("/backend/fetch-complaint/:id").get(fetchSingleComplaint);
router.route("/backend/fetch-complaints").get(isAuth, isCustomer , fetchComplaints)

// repair request
router.route("/backend/register-request").post(isAuth, isCustomer, repairRequest);
router.route("/backend/fetch-request/:id").get(fetchSingleRequest);
router.route("/backend/fetch-requests").get(isAuth, isCustomer , fetchRequests)


// contact us
router.route("/backend/contact-us").post(contactUs);


// review
router.route("/backend/create-review").post(isAuth , isCustomer , createProductReview)


// cart
router.route("/backend/add-to-cart").post(isAuth , isCustomer , addToCart);
router.route("/backend/delete-from-cart").delete(isAuth , isCustomer , deleteFromCart);
router.route("/backend/increase-qty").put(isAuth , isCustomer , increaseQuantity);
router.route("/backend/decrease-qty").put(isAuth , isCustomer , decreaseQuantity);
router.route("/backend/fetch-customer-cart").get(isAuth , isCustomer , fetchCustomerCart);



// address
router.route("/backend/add-address").post(isAuth , isCustomer , addAddress );
router.route("/backend/update-address").put(isAuth , isCustomer , editAddress );
router.route("/backend/delete-address").delete(isAuth , isCustomer , deleteAddress );




// get routes
router.route("/backend/get-all-products").get(getAllProducts);
router.route("/backend/get-single-product/:id").get(getProductDetails);


// popup form
router.route("/backend/popup-form").post(popupForm);


module.exports = router