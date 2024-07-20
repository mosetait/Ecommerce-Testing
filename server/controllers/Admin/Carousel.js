const Carousel = require('../../models/Carousel');
const asyncHandler = require('../../middlewares/asyncHandler');
const { uploadImageToCloudinary } = require('../../utils/imageUploader');
const ErrorHandler = require('../../utils/errorHandler');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;


function parseImagesData(imagesDataString) {
    try {
        // Use regex to format the string correctly for JSON parsing
        const formattedString = imagesDataString
            .replace(/([{,])(\s*)(\w+)(\s*):/g, '$1"$3":')  // Add quotes around keys
            .replace(/'/g, '"');  // Replace single quotes with double quotes

        return JSON.parse(formattedString);
    } catch (err) {
        throw new Error("Invalid format for imagesData");
    }
}

// Create new carousel
exports.createCarousel = asyncHandler(async (req, res, next) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { title, active, imagesData } = req.body;
        const images = req?.files?.images;

        
        if (!title || !images) {
            await session.abortTransaction();
            session.endSession();
            return next(new ErrorHandler("Title and images are required", 400));
        }

        // Parse imagesData using the new function
        let parsedImagesData;
        try {
            parsedImagesData = parseImagesData(imagesData);
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            return next(new ErrorHandler(err.message, 400));
        }


        // Check if carousel exists with the title
        let existingCarousel = await Carousel.findOne({ title }).session(session);

        if (existingCarousel) {
            await session.abortTransaction();
            session.endSession();
            return next(new ErrorHandler("Carousel already exists.", 401));
        }

        // Upload images to Cloudinary with altText and caption
        const uploadedImages = await Promise.all(
            images.map(async (image, index) => {
                const { altText, caption } = parsedImagesData[index] || { altText: '', caption: '' }; // Default values if not provided
                const result = await uploadImageToCloudinary(image, process.env.CAROUSEL_FOLDER_NAME);

                return {
                    public_id: result.public_id,
                    url: result.secure_url,
                    altText,
                    caption
                };
            })
        );


        const carousel = new Carousel({
            title,
            images: uploadedImages,
            active
        });

        await carousel.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            data: carousel
        });

    } catch (error) {
  
        await session.abortTransaction();
        session.endSession();
        return next(new ErrorHandler(error.message, 500));
    }
});






// Utility function to delete images from Cloudinary
async function deleteImagesFromCloudinary(images) {
    return Promise.all(
        images.map(async (image) => {
            return cloudinary.uploader.destroy(image.public_id);
        })
    );
}




// Edit existing carousel
exports.updateCarousel = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { carouselId } = req.params;
        const images = req?.files?.file;

        // Validate input
        if (!carouselId) {
            await session.abortTransaction();
            session.endSession();
            return next(new ErrorHandler("Carousel ID is required", 400));
        }

        // Find the carousel to edit
        let carousel = await Carousel.findById(carouselId).session(session);
        if (!carousel) {
            await session.abortTransaction();
            session.endSession();
            return next(new ErrorHandler("Carousel not found", 404));
        }

        // Delete old images from Cloudinary if new images are provided
        if (images) {
            await deleteImagesFromCloudinary(carousel.images);

            let uploadedImages = [];

            if (Array.isArray(images)) {
                uploadedImages = await Promise.all(
                    images.map(async (image) => {
                        const result = await uploadImageToCloudinary(image, process.env.CAROUSEL_FOLDER_NAME);
                        return {
                            public_id: result.public_id,
                            url: result.secure_url,
                        };
                    })
                );
            } else {
                const result = await uploadImageToCloudinary(images, process.env.CAROUSEL_FOLDER_NAME);
                uploadedImages = [{
                    public_id: result.public_id,
                    url: result.secure_url,
                }];
            }

            // Update images in the carousel
            carousel.images = uploadedImages;
        }

        // Save the updated carousel
        await carousel.save({ session });

        await session.commitTransaction();
        session.endSession();

        const updatedCarousel = await Carousel.findOne({ title: "Hero Section Carousel" });

        res.status(200).json({
            success: true,
            carousel: updatedCarousel
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return next(new ErrorHandler(error.message, 500));
    }
});










// Delete carousel
exports.deleteCarousel = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.body;

        const carousel = await Carousel.findById(id).session(session);

        if (!carousel) {
            await session.abortTransaction();
            session.endSession();
            return next(new ErrorHandler("Carousel not found", 404));
        }

        // Delete images from Cloudinary
        for (let i = 0; i < carousel.images.length; i++) {
            console.log("Deleting Images")
            await cloudinary.uploader.destroy(carousel.images[i].public_id);
        }


        await carousel.deleteOne({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Carousel deleted"
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return next(new ErrorHandler(error.message, 500));
    }
});





// edit carousel order
exports.updateCarouselOrder = asyncHandler(async (req, res) => {
    const { carouselId, newImagesOrder } = req.body;

    try {
        // Find the carousel by ID
        const carousel = await Carousel.findById(carouselId);

        if (!carousel) {
            return res.status(404).json({ message: "Carousel not found" });
        }

        // Update the images array with the new order
        carousel.images = newImagesOrder;

        // Save the updated carousel
        await carousel.save();

        const updatedCarousel = await Carousel.findOne({title: "Hero Section Carousel"});

        res.status(200).json({ message: "Carousel order updated successfully", carousel: updatedCarousel });
    } 
    catch (error) {
        console.error("Error updating carousel order:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
