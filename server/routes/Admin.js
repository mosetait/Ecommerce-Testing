const express = require("express");
const { isAuth, isAdmin } = require("../middlewares/auth");
const { createCategory, updateCategory, deleteCategory, createSubCategory, updateSubCategory, deleteSubCategory, allCategories } = require("../controllers/Admin/Category");
const { createProduct, updateProductDetails, deleteProduct, allProducts, productDetails, updateProductImages } = require("../controllers/Admin/Product");
const { createNotification, deleteNotification, updateNotification } = require("../controllers/Admin/Notification");
const { createTechnician, updateTechnician, deleteTechnician, allotTechnician } = require("../controllers/Admin/Technician");
const { approveReview, deleteReview, allReviews } = require("../controllers/Admin/Review");
const { blockUnblockCustomerAccount, deleteCustomer, allCustomers, singleCustomer } = require("../controllers/Admin/Customer");
const { updateOrderStatus } = require("../controllers/Admin/Order");
const { getAllCustomers, getSingleCustomer } = require("../controllers/Admin/getControllers");
const { createDealDocument, addProductsToDeal, fetchDeals, removeProductFromDeal } = require("../controllers/Admin/Deals");
const { createCarousel, updateCarousel, deleteCarousel, updateCarouselOrder } = require("../controllers/Admin/Carousel");
const { dashboardData, allOrders, orderDetails } = require("../controllers/Admin/Dashboard");
const { allRequests, singleRequest, updateRequestStatus, deleteRequest, allComplaints, singleComplaint, updateComplaintStatus, deleteComplaint } = require("../controllers/Admin/ReviewAndComplaints");
const { allPayments } = require("../controllers/Admin/Payment");
const { allInquiries, singleInquiry, updateInquiry, deleteInquiry } = require("../controllers/Admin/PopupForm");
const router = express.Router();



// Category routes
router.route("/backend/create-category").post(isAuth , isAdmin , createCategory);
router.route("/backend/update-category").put(isAuth , isAdmin , updateCategory);
router.route("/backend/delete-category/:id").delete(isAuth , isAdmin , deleteCategory);


router.route("/backend/create-sub-category").post(isAuth , isAdmin , createSubCategory);
router.route("/backend/update-sub-category").put(isAuth , isAdmin , updateSubCategory);
router.route("/backend/delete-sub-category/:id").delete(isAuth , isAdmin , deleteSubCategory);




// Products Routes
router.route("/backend/create-product").post(isAuth , isAdmin , createProduct);
router.route("/backend/update-product-details").put(isAuth , isAdmin , updateProductDetails);
router.route("/backend/update-product-images").put(isAuth , isAdmin , updateProductImages);
router.route("/backend/delete-product/:id").delete(isAuth , isAdmin , deleteProduct);



// Carousel Routes
router.route("/backend/create-carousel").post(isAuth , isAdmin , createCarousel);
router.route("/backend/update-carousel/:carouselId").put(isAuth , isAdmin , updateCarousel);
router.route("/backend/delete-carousel").delete(isAuth , isAdmin , deleteCarousel);
router.route("/backend/update-carousel-order").put(isAuth , isAdmin , updateCarouselOrder);



//Notification route
router.route("/backend/create-notification").post(isAuth , isAdmin , createNotification);
router.route("/backend/update-notification").put(isAuth , isAdmin , updateNotification);
router.route("/backend/delete-notification").delete(isAuth , isAdmin , deleteNotification);


// Technician route
router.route("/backend/create-technician").post(isAuth , isAdmin , createTechnician);
router.route("/backend/update-technician").put(isAuth , isAdmin , updateTechnician);
router.route("/backend/delete-technician").delete(isAuth , isAdmin , deleteTechnician);
router.route("/backend/allot-technician").put(isAuth , isAdmin , allotTechnician);


// Rating and Review
router.route("/backend/approve-review").put(isAuth , isAdmin , approveReview);
router.route("/backend/delete-review/:id").delete(isAuth , isAdmin , deleteReview);


// block / unblock customer
router.route("/backend/block-unblock-customer").put(isAuth , isAdmin , blockUnblockCustomerAccount);

// delete customer
router.route("/backend/delete-customer").delete(isAuth , isAdmin , deleteCustomer)



// order
router.route("/backend/update-order-status").put(isAuth , isAdmin , updateOrderStatus);


// deal
router.route("/backend/create-deal-document").post(isAuth , isAdmin , createDealDocument);
router.route("/backend/add-products-deal").put(isAuth , isAdmin , addProductsToDeal);
router.route("/backend/remove-product-deal").put(isAuth , isAdmin , removeProductFromDeal);


// customer routes
router.route("/backend/block-unblock-customer").put(isAuth , isAdmin , blockUnblockCustomerAccount);
router.route("/backend/delete-customer/:id").delete(isAuth , isAdmin , deleteCustomer);



// complaint and repair request
router.route("/backend/all-requests").get(isAuth , isAdmin , allRequests);
router.route("/backend/request/:id").get(isAuth , isAdmin , singleRequest);
router.route("/backend/update-request").put(isAuth , isAdmin , updateRequestStatus);
router.route("/backend/delete-request/:id").delete(isAuth , isAdmin , deleteRequest);


router.route("/backend/all-complaints").get(isAuth , isAdmin , allComplaints);
router.route("/backend/complaint/:id").get(isAuth , isAdmin , singleComplaint);
router.route("/backend/update-complaint").put(isAuth , isAdmin , updateComplaintStatus);
router.route("/backend/delete-complaint/:id").delete(isAuth , isAdmin , deleteComplaint);


// payments
router.route("/backend/all-payments").get(isAuth , isAdmin , allPayments)


// popup form inquiries
router.route("/backend/all-inquiries").get(isAuth , isAdmin , allInquiries);
router.route("/backend/inquiry/:id").get(isAuth , isAdmin , singleInquiry);
router.route("/backend/update-inquiry").put(isAuth , isAdmin , updateInquiry);
router.route("/backend/delete-inquiry/:id").delete(isAuth , isAdmin , deleteInquiry);



// ----------------------- GET ROUTES -------------------------------------


router.route("/backend/get-all-customers").get(isAuth , isAdmin , getAllCustomers);
router.route("/backend/get-single-customer/:id").get(isAuth , isAdmin , getSingleCustomer);

router.route("/backend/dashboard-data").get(isAuth , isAdmin , dashboardData);
router.route("/backend/all-orders").get(isAuth , isAdmin , allOrders);
router.route("/backend/order/:id").get(isAuth , isAdmin , orderDetails);
router.route("/backend/all-products").get(isAuth , isAdmin , allProducts);
router.route("/backend/product/:id").get(isAuth , isAdmin , productDetails);
router.route("/backend/all-categories").get(isAuth , isAdmin , allCategories);
router.route("/backend/all-customers").get(isAuth , isAdmin , allCustomers);
router.route("/backend/customer/:id").get(isAuth , isAdmin , singleCustomer);
router.route("/backend/fetch-deals-admin").get(isAuth , isAdmin , fetchDeals);
router.route("/backend/all-reviews").get(isAuth , isAdmin , allReviews);


module.exports = router