const RepairRequest = require("../../models/RepairRequest");
const Complaint = require("../../models/Complaint");
const asyncHandler = require("../../middlewares/asyncHandler");
const ErrorHandler = require("../../utils/errorHandler");
const Customer = require("../../models/Customer");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;



// delte from cloudinary
const deleteFileFromCloudinary = async (publicId) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
};


// fetch all requests
exports.allRequests = asyncHandler( async (req,res,next) => {

    const requests = await RepairRequest.find().sort({ createdAt: -1 })
    .populate("customer")
    .populate("product")
    .populate("assignedTo")


    return res.status(200).json({
        success: true,
        message: "Requests Fetched Successfully",
        requests
    })

})

// fetch single request
exports.singleRequest = asyncHandler( async (req,res,next) => {

    const {id} = req.params;
console.log(req.params)
    // Validate input
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid input data", 400));
    }

    const request = await RepairRequest.findOne({_id: id})
    .populate("customer")
    .populate("product")
    .populate("assignedTo")


    return res.status(200).json({
        success: true,
        message: "Requests Fetched Successfully",
        request
    })


})



// Update single request status
exports.updateRequestStatus = asyncHandler(async (req, res, next) => {
    const { id, status } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid input data", 400));
    }

    // Validate status
    const validStatuses = ["pending", "processing", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
        return next(new ErrorHandler("Invalid status provided", 400));
    }

    // Find and update the repair request
    const repairRequest = await RepairRequest.findById(id);
    if (!repairRequest) {
        return next(new ErrorHandler("Repair request not found", 404));
    }

    repairRequest.status = status;
    await repairRequest.save();

    const requests = await RepairRequest.find()
    .populate("customer")
    .populate("product")
    .populate("assignedTo")


    return res.status(200).json({
        success: true,
        message: "Repair request status updated successfully",
        requests
    });
});



// Delete single repair request
exports.deleteRequest = asyncHandler(async (req, res, next) => {

    const { id } = req.params;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid input data", 400));
    }

    // Find the repair request
    const repairRequest = await RepairRequest.findById(id);
    if (!repairRequest) {
        return next(new ErrorHandler("Repair request not found", 404));
    }

    // Remove the repair request from the customer's repairRequests array
    const customer = await Customer.findById(repairRequest.customer);

    // Validate input
    if (!customer) {
        return next(new ErrorHandler("Customer Not Found", 400));
    }

    if (customer) {
        customer.repairRequests = customer.repairRequests.filter(reqId => !reqId.equals(id));
        await customer.save();
    }

    // Delete the repair request
    await repairRequest.deleteOne();

    const requests = await RepairRequest.find()
    .populate("customer")
    .populate("product")
    .populate("assignedTo")

    return res.status(200).json({
        success: true,
        message: "Repair request deleted successfully",
        requests
    });
});





// Fetch all complaints
exports.allComplaints = asyncHandler(async (req, res,next) => {
    const complaints = await Complaint.find().sort({ createdAt: -1 })
        .populate('customer')
        .populate('product')
        .populate('technician');

    return res.status(200).json({
        success: true,
        message: "Complaints fetched successfully",
        complaints
    });
});




// Fetch single complaint
exports.singleComplaint = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid input data", 400));
    }

    const complaint = await Complaint.findById(id)
        .populate('customer')
        .populate('product')
        .populate('technician');

    if (!complaint) {
        return next(new ErrorHandler("Complaint not found", 404));
    }

    return res.status(200).json({
        success: true,
        message: "Complaint fetched successfully",
        complaint
    });
});



// Update single complaint
exports.updateComplaintStatus = asyncHandler(async (req, res, next) => {
    const { id, status, comment } = req.body.id;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid input data", 400));
    }

    // Validate status
    const validStatuses = ["pending", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
        return next(new ErrorHandler("Invalid status provided", 400));
    }

    // Find and update the complaint
    const complaint = await Complaint.findById(id);
    if (!complaint) {
        return next(new ErrorHandler("Complaint not found", 404));
    }

    complaint.status = status;
    if (comment) {
        complaint.comment = comment;
    }
    await complaint.save();

    const complaints = await Complaint.find()
        .populate('customer')
        .populate('product')
        .populate('technician');

    return res.status(200).json({
        success: true,
        message: "Complaint status updated successfully",
        complaints
    });
});



// Delete single complaint
exports.deleteComplaint = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid input data", 400));
    }

    // Find the complaint
    const complaint = await Complaint.findById(id);
    if (!complaint) {
        return next(new ErrorHandler("Complaint not found", 404));
    }

    // Remove the complaint from the customer's complaints array
    const customer = await Customer.findById(complaint.customer);
    if (!customer) {
        return next(new ErrorHandler("Customer not found", 404));
    }

    customer.complaints = customer.complaints.filter(complaintId => !complaintId.equals(id));
    await customer.save();


    // Delete the bill from Cloudinary
    if (complaint.bill && complaint.bill.publicId) {
        try {
            await deleteFileFromCloudinary(complaint.bill.publicId);
        } catch (error) {
            return next(new ErrorHandler("Failed to delete bill from Cloudinary", 500));
        }
    }

    // Delete the complaint
    await complaint.deleteOne();

    const complaints = await Complaint.find()
        .populate('customer')
        .populate('product')
        .populate('technician');

    return res.status(200).json({
        success: true,
        message: "Complaint deleted successfully",
        complaints
    });
});