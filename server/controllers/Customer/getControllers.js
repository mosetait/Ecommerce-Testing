const Complaint = require("../../models/Complaint");
const RepairRequest = require("../../models/RepairRequest");
const asyncHandler = require("../../middlewares/asyncHandler");




// fetch complaints
exports.fetchComplaints = asyncHandler(async (req, res) => {
    try {
      const complaints = await Complaint.find({ customer: req.user.id })
        .populate('customer')
        .populate('product')
        .populate('technician');
  
      res.status(200).json({
        message: "Complaints Fetched Successfully",
        complaints,
        success: true
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
});
  



// fetch requests
exports.fetchRequests = asyncHandler(async (req, res, next) => {
    try {
      const requests = await RepairRequest.find({ customer: req.user.id })
        .populate('customer')
        .populate('product')
        .populate('assignedTo');
  
      res.status(200).json({
        message: "Requests Fetched Successfully",
        requests,
        success: true
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 500));
    }
});