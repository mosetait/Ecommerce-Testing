const asyncHandler = require("../../middlewares/asyncHandler");
const Technician = require("../../models/Technician");
const { uploadImageToCloudinary } = require("../../utils/imageUploader");
const cloudinary = require("cloudinary").v2;
const Complaint = require("../../models/Complaint");


// create technician 
exports.createTechnician = asyncHandler( async (req,res) => {

    const {

        firstName,
        lastName,
        email,
        contactNumber,
        address,
        expertise,

    } = req.body;

    const image = req?.files?.image;


    // validation
    if(!firstName || !lastName || !contactNumber || !address || !expertise){
        return res.status(200).json({
            message: "Please fill all required field.",
            success: false
        })
    }


    // check  if technician already exist
    const existingTech = await Technician.findOne({contactNumber});

    if(existingTech){
        return res.status(200).json({
            message: "Technician already exist with this Number.",
            success: false
        })
    }


    // if image available
    let uploadTechImage;
    try{
        if(image){
            uploadTechImage = await uploadImageToCloudinary(image, process.env.TECHNICIAN_FOLDER_NAME);
        }
    }
    catch(error){
        throw Error(error);
    }


    // create technician
    const newTech = await Technician.create({
        firstName,
        lastName,
        email,
        contactNumber,
        address,
        expertise,
        image: image ? 
                {
                    url: uploadTechImage.secure_url,
                    publicId: uploadTechImage.public_id
                } 
                : 
                {}
    })

    return res.status(200).json({
        message: "Technician Created Successfully",
        success: true,
        newTech
    })
})



//  update technician 
exports.updateTechnician = asyncHandler(async (req, res) => {

    const {
        technicianId,
        firstName,
        lastName,
        email,
        contactNumber,
        address,
        expertise
    } = req.body;

    const image = req?.files?.image;

    // Validation
    if (!firstName || !lastName || !contactNumber || !address || !expertise || !technicianId) {
        return res.status(400).json({
            message: "Please fill all required fields.",
            success: false
        });
    }

    // Find the technician by ID
    let technician = await Technician.findById({_id: technicianId});

    if (!technician) {
        return res.status(404).json({
            message: "Technician not found.",
            success: false
        });
    }

    // check if another technican exist with the email
    const existingEmail = await Technician.findOne({email});

    if(existingEmail && String (existingEmail._id) !== String(technicianId)){
        return res.status(401).json({
            message: "Email Already Exist",
            success: false
        })
    }

    // Check if technician already exists with the new contact number (if it is being changed)
    if (contactNumber !== technician.contactNumber) {
        const existingTech = await Technician.findOne({ contactNumber });
        if (existingTech) {
            return res.status(400).json({
                message: "Technician already exists with this contact number.",
                success: false
            });
        }
    }

    // If a new image is provided, upload it and delete the old image
    let uploadTechImage;
    if (image) {
        try {
            uploadTechImage = await uploadImageToCloudinary(image, process.env.TECHNICIAN_FOLDER_NAME);
            if (technician.image.publicId) {
                await deleteImageFromCloudinary(technician.image.publicId);
                console.log("deleted old image")
            }
            technician.image = {
                url: uploadTechImage.secure_url,
                publicId: uploadTechImage.public_id
            };
        } catch (error) {
            return res.status(500).json({
                message: "Error uploading image.",
                success: false,
                error: error.message
            });
        }
    }

    // Update technician details
    technician.firstName = firstName;
    technician.lastName = lastName;
    technician.email = email;
    technician.contactNumber = contactNumber;
    technician.address = address;
    technician.expertise = expertise;

    await technician.save();

    return res.status(200).json({
        message: "Technician updated successfully.",
        success: true,
        technician
    });
});



// delete technician
exports.deleteTechnician = asyncHandler( async (req,res) => {

    const {technicianId} = req.body;

    if(!technicianId){
        return res.status(401).json({
            message: "Please provide technician's Id",
            success: false
        })
    }

    // find technician
    const technician = await Technician.findOne({_id : technicianId});

    if(!technician){
        return res.status(404).json({
            message: "Technician Not Found",
            success: false
        })
    }

    // delete technician image from cloudinary
    if(technician.image){
        await cloudinary.uploader.destroy(technician?.image?.publicId);
    }

    // delete technician 
    await technician.deleteOne();

    return res.status(200).json({
        message: "Technician deleted successfully.",
        success: true
    })

})






// allot technician 
exports.allotTechnician = asyncHandler( async (req,res) => {

    const {technicianId , complaintId} = req.body;
    
    if(!technicianId || !complaintId){
        return res.status(401).json({
            message: "Please provide all mandatory details.",
            success: false
        })
    }

    // find technican
    const technician = await Technician.findOne({_id: technicianId});

    if(!technician){
        return res.status(404).json({
            message: "Technician Not Found.",
            success: false
        }) 
    }

    // find complaint
    const complaint = await Complaint.findOne({_id: complaintId});

    if(!complaint){
        return res.status(404).json({
            message: "Complaint Not Found.",
            success: false
        }) 
    }


    // allot technician to complaint
    await complaint.updateOne({technician: technician._id});
    await complaint.save();

    // push complaint to technician 
    await technician.complaints.push(complaint._id);
    await technician.save();

    return res.status(200).json({
        message: "Technician Alloted Successfully.",
        success: true
    })
})





// get all technicians
exports.allTechnicians = asyncHandler( async (req,res) => {

    const technicians = await Technician.find().populate({path: "complaints"});

    return res.status(200).json({
        message: "Technicians fetched successfully.",
        technicians,
        success: true
    })

})