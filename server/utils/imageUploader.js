const cloudinary = require("cloudinary").v2;

exports.uploadImageToCloudinary = async (file, folder, quality = "auto:low") => {
    const options = {
        folder,
        resource_type: "auto",
        quality: quality,
        transformation: [
            { fetch_format: "auto" },
            { flags: "progressive" },
            { effect: "auto_brightness" },
            { effect: "auto_contrast" },
            { effect: "auto_color" },
            { effect: "sharpen:30" },
            { flags: "lossy" }
        ]
    };

    return await cloudinary.uploader.upload(file.tempFilePath, options);
};
