const PopupForm = require("../../models/PopupForm");
const asyncHandler = require("../../middlewares/asyncHandler");


// update inquiry 
exports.updateInquiry = asyncHandler( async (req,res) => {

    const {_id: id , comment , status} = req.body.updatedInquiry;

    if (!id || !status) {
        return res.status(401).json({
            success: false,
            message: "Please fill all fields"
        })
    }


    const popupForm = await PopupForm.findByIdAndUpdate(
        {_id: id},
        {
            comment: comment ? comment : "",
            status
        }
    )

    const inquiries = await PopupForm.find();

    return res.status(200).json({
        success: true,
        message: "Inquiry Updated Successfully",
        inquiries
    })
})


//  delete inquiry
exports.deleteInquiry = asyncHandler( async (req,res) => {

    const {id} = req.params;
console.log(req.params)
    if (!id) {
        return res.status(401).json({
            success: false,
            message: "Please provide Id of the inquiry"
        })
    }


    await PopupForm.findByIdAndDelete({_id: id});

    const inquiries = await PopupForm.find();

    return res.status(200).json({
        success: true,
        message: "Inquiry Deleted Successfully",
        inquiries
    })
})


// get all inquiries
exports.allInquiries = asyncHandler( async (req,res) => {

    const inquiries = await PopupForm.find().sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        message: "Inquiry Fetched Successfully",
        inquiries
    })
})



// get single inquiry
exports.singleInquiry = asyncHandler( async (req,res) => {

    const {id} = req.params;

    const inquiry = await PopupForm.findOne({_id: id});

    return res.status(200).json({
        success: true,
        message: "Inquiry Fetched Successfully",
        inquiry
    })
})