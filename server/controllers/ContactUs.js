const ContactUs = require("../models/ContactUs");
const { contactUsEmail } = require("../mailTemplate/contactUs");
const { complaintRegistrationEmail } = require("../mailTemplate/complaintRegistered");
const asyncHandler = require("../middlewares/asyncHandler");
const Complaint = require("../models/Complaint");
const PopupForm = require("../models/PopupForm");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const mailSender = require("../utils/mailSender");
const ErrorHandler = require("../utils/errorHandler");
const RepairRequest = require("../models/RepairRequest");
const { repairRequestEmail } = require("../mailTemplate/requestRegistered");
const mongoose = require("mongoose")



// contact us
exports.contactUs = asyncHandler(async (req, res) => {

    const {
        name, 
        contactNumber, 
        email, 
        subject, 
        message
    } = req.body.formData;

    if (!name || !email || !subject || !message) {
        return res.status(401).json({
            message: "Please fill all required fields.",
            success: false
        });
    }

    const newContact = await ContactUs.create({
        name, 
        contactNumber, 
        email, 
        subject, 
        message
    });

    // Emit the new contact event
    const io = req.app.get('io');
    io.emit('newContact', newContact);

    // send email
    try {
        // To customer
        await mailSender(
            email,
            "Contact | Moseta",
            contactUsEmail(
                email,
                name,
                message,
                contactNumber
            )
        );
    } catch (error) {
        throw Error(error);
    }

    return res.status(200).json({
        message: "Email sent. We will get back to you soon.",
        success: true
    });

});





// Register a complaint
exports.registerComplaint = asyncHandler(async (req, res) => {

    const {
        productId,
        nature,
        description,
        contactNumber,
        address,
        pincode,
        serialNumber
    } = req.body;


    const bill = req.files?.bill;
    

    if (!productId || !nature || !description || !contactNumber) {
        return res.status(400).json({
            message: "Please fill all mandatory fields.",
            success: false
        });
    }

    if (!bill) {
        return res.status(400).json({
            message: "Please provide bill of the product.",
            success: false
        });
    }


    // Check if id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid category id."
        });
    }

    // check if customer exist
    const customer = await Customer.findOne({_id: req.user.id});

    if(!customer){
        return res.status(404).json({
            message: "Customer not found. Please login again.",
            success: false
        });
    }

    // check if product exist
    const product = await Product.findOne({_id: productId});

    if(!product){
        return res.status(404).json({
            message: "Product not found.",
            success: false
        });
    }



    // Check if the customer already made the complaint
    const existingComplaint = await Complaint.findOne({ 
        customer : req.user.id, 
        product : productId
    });


    if (existingComplaint && existingComplaint.status === "pending") {
        return res.status(200).json({
            message: "We have received your complaint. Please wait we are processing your complaint, we will get back to you soon.",
            success: false,
        });
    }

    
    // Upload bill to Cloudinary
    let uploadResult;
    try {
        uploadResult = await uploadImageToCloudinary(bill, process.env.COMPLAINT_BILLS_FOLDER_NAME);
    } catch (error) {
        return res.status(500).json({
            message: "Error uploading bill to Cloudinary.",
            success: false,
            error: error.message
        });
    }


    // Create a new complaint with the bill details
    const newComplaint = await Complaint.create({
        customer : req.user.id,
        product : productId,
        nature,
        address: address + " " + pincode,
        serialNumber,
        description,
        bill: {
            publicId: uploadResult.public_id,
            secureUrl: uploadResult.secure_url
        },
        contactNumber
    });


    // add complaints to customer's complaints array
    customer.complaints.push(newComplaint._id);
    await customer.save();


    // Populate the necessary fields in the newRequest
    const populatedComplaint = await Complaint.findById(newComplaint._id)
    .populate('customer') // populate customer details (adjust the fields as necessary)
    .populate('product'); // populate product details (adjust the fields as necessary)


    // Emit the new complaint event
    const io = req.app.get('io');
    io.emit('newComplaint', populatedComplaint);


    // send complaint registration email
    try{
        await mailSender(
            customer.email , 
            "Complaint Registration",
            complaintRegistrationEmail(
                customer.firstName,
                product.name,
                contactNumber,
                nature,
                description,
                newComplaint.complaintId
            )
        )
    }
    catch(error){
        throw Error(error);
    }


    return res.status(201).json({
        message: "Complaint registered successfully.",
        success: true,
        complaint: newComplaint
    });
});




// fetch complaint status
exports.fetchSingleComplaint = asyncHandler( async (req,res) => {

    const {id} = req.params;

    if(!id){
        return new ErrorHandler("Please provide product Id" , 401);
    }
    
    const complaint = await Complaint.findOne({complaintId: id}).populate({path: "product"});
    
    if(!complaint){
        return res.status(404).json({
            message: "Complaint Not Found. Please check your compalint id.",
            success: false
        })
    }


    return res.status(200).json({
        message: "Complaint fetched successfully",
        complaint
    })
})





// register repair request 
exports.repairRequest = asyncHandler( async (req,res) => {

    const {

        productId,
        description,
        contactNumber,
        address,
        pincode,
        serialNumber,

    } = req.body.formData;


    if(!productId || !description || !contactNumber || !address){
        return new ErrorHandler("All fields are required." , 401);
    }


    // Check if id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid category id."
        });
    }
    
    // check if customer exist
    const customer = await Customer.findOne({_id: req.user.id});

    if(!customer){
        return res.status(404).json({
            message: "Customer not found. Please login again.",
            success: false
        });
    }

    // check if product exist
    const product = await Product.findOne({_id: productId});

    if(!product){
        return res.status(404).json({
            message: "Product not found.",
            success: false
        });
    }



    // Check if the customer already made the complaint
    const existingRequest = await RepairRequest.findOne({ 
        customer : req.user.id, 
        product : productId
    });    


    if (existingRequest && existingRequest.status === "pending") {
        return res.status(200).json({
            message: "We have received your request. Please wait we are processing your request, we will get back to you soon.",
            success: false,
        });
    }



    // Create a new complaint with the bill details
    const newRequest = await RepairRequest.create({
        customer: req.user.id,
        product: productId,
        productId,
        description,
        contactNumber,
        address: address + " " + pincode ,
        serialNumber,
    });

    // Add complaints to customer's complaints array
    customer.repairRequests.push(newRequest._id);
    await customer.save();

    // Populate the necessary fields in the newRequest
    const populatedRequest = await RepairRequest.findById(newRequest._id)
        .populate('customer') // populate customer details (adjust the fields as necessary)
        .populate('product'); // populate product details (adjust the fields as necessary)


    // Emit the new complaint event with the populated data
    const io = req.app.get('io');
    io.emit('newRequest', populatedRequest);



    // send complaint registration email
    try{
        await mailSender(
            customer.email , 
            "Repair Request Registration",
            repairRequestEmail(
                customer.firstName,
                product.name,
                contactNumber,
                description,
                newRequest.requestId
            )
        )
    }
    catch(error){
        throw Error(error);
    }


    return res.status(201).json({
        message: "Request registered successfully.",
        success: true,
        newRequest
    });

})



// fetch repair request status
exports.fetchSingleRequest = asyncHandler( async (req,res) => {

    const {id} = req.params;

    if(!id){
        return new ErrorHandler("Please provide product Id" , 401);
    }


    const request = await RepairRequest.findOne({requestId: id}).populate({path: "product"});

    if(!request){
        return res.status(404).json({
            message: "Request Not Found. Please check your request id.",
            success: false
        })
    }


    return res.status(200).json({
        message: "Request fetched successfully",
        request
    })
})







// popup form 
exports.popupForm = asyncHandler(async (req, res) => {

    const { fullName, email, phone, inquiry } = req.body.formData;

    if (!fullName || !email || !phone || !inquiry) {
        return res.status(401).json({
            message: "Please provide all details",
            success: false
        });
    }

    const newPopupForm = await PopupForm.create({
        fullName, email, phone, inquiry
    });

    // Emit the new popup form event
    const io = req.app.get('io');
    io.emit('newPopupForm', newPopupForm);

    const emailTemplate = `Inquiry From Moseta.in<br>
    <br>
    Email: ${email}<br>
    Full Name: ${fullName}<br>
    Phone No.: ${phone}<br>
    Inquiry: ${inquiry}<br>`;

    // Send email
    try {
        const mailResponse = await mailSender(
            "dhyanisaksham3@gmail.com, priyankarajput@moseta.in",
            "Inquiry | Moseta website",
            emailTemplate
        );

    } catch (error) {
        console.log("Error occurred while sending email: ", error);
        throw error;
    }

    return res.status(200).json({
        message: "Form Submitted",
        success: true
    });

});
