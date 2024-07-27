const Product = require('../../models/Product');
const ErrorHandler = require('../../utils/errorHandler');
const cloudinary = require('cloudinary');
const asyncHandler = require('../../middlewares/asyncHandler');
const { uploadImageToCloudinary } = require('../../utils/imageUploader');
const Category = require("../../models/Category");
const SubCategory = require("../../models/SubCategory");



// Create Product ---ADMIN
exports.createProduct = asyncHandler(async (req, res) => {
    // Get all required fields from request body
 
    let {
        name,
        description,
        highlights,
        specifications,
        price,
        cuttedPrice,
        categoryId,
        status,
        subCategoryId,
        gst
    } = req.body;


    // try {
    //     // Parse JSON strings to objects/arrays if they are strings
    //     if (typeof highlights === 'string') highlights = JSON.parse(highlights);
    // } catch (error) {
    //     return res.status(400).json({
    //         success: false,
    //         message: "Invalid JSON format",
    //     });
    // }

    // Parse specifications from JSON strings to objects
    if (specifications && Array.isArray(specifications)) {
        specifications = specifications.map(spec => JSON.parse(spec));
    }


    // Get images from request files
    const themeImage = req?.files?.themeImage;
    const otherImages = req?.files?.images;

    // Check if themeImage is provided
    if (!themeImage) {
        return res.status(401).json({
            success: false,
            message: "Theme Image Required.",
        });
    }

    // Check if any of the required fields are missing
    if (!name || !description || !categoryId || !status || !highlights || !price || !cuttedPrice) {
        return res.status(400).json({
            success: false,
            message: "All Fields are Mandatory",
        });
    }

    // Check if product exists with the same name
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
        return res.status(401).json({
            message: "Product already exists.",
            success: false
        });
    }

    // Check if the category given is valid
    const categoryDetails = await Category.findById(categoryId);
    if (!categoryDetails) {
        return res.status(404).json({
            success: false,
            message: "Category Details Not Found",
        });
    }

    // Check if the sub category given is valid
    if (subCategoryId) {
        const subCategoryDetails = await SubCategory.findById(subCategoryId);
        if (!subCategoryDetails) {
            return res.status(404).json({
                success: false,
                message: "SubCategory Details Not Found",
            });
        }

        // Check if sub category belongs to category
        if (!categoryDetails.subCategories.includes(subCategoryId)) {
            return res.status(401).json({
                success: false,
                message: "Sub Category does not belong to this Category"
            });
        }
    }

    // Upload theme image to Cloudinary
    let uploadThemeImage;
    if (themeImage) {
        uploadThemeImage = await uploadImageToCloudinary(themeImage, process.env.PRODUCT_FOLDER_NAME, "auto:low");
    }

    // Upload other images to Cloudinary
    const uploadImagesToCloudinary = async (otherImages) => {
        const imagesArray = Array.isArray(otherImages) ? otherImages : [otherImages];

        if (imagesArray.length === 0) {
            return [];
        }

        const uploadedImages = await Promise.all(
            imagesArray.map(async (image) => {
                const result = await uploadImageToCloudinary(image, process.env.PRODUCT_FOLDER_NAME);
                return {
                    public_id: result.public_id,
                    url: result.secure_url,
                };
            })
        );

        return uploadedImages;
    };

    let uploadedOtherImages = [];
    if (otherImages) {
        uploadedOtherImages = await uploadImagesToCloudinary(otherImages);
    }

    // Create a new product with the given details and uploaded image objects
    const newProductData = {
        name,
        description,
        highlights: Array.isArray(highlights) ? highlights : [highlights],
        specifications: Array.isArray(specifications) ? specifications : [specifications],
        price,
        cuttedPrice,
        gst,
        category: categoryId,
        status,
        themeImage: themeImage ? {
            public_id: uploadThemeImage.public_id,
            url: uploadThemeImage.secure_url
        } : null,
        otherImages: uploadedOtherImages,
    };

    if (subCategoryId) {
        newProductData.subCategory = subCategoryId;
    }

    const newProduct = await Product.create(newProductData);

    // Add product in sub category
    if (subCategoryId) {
        const addToSubCategory = await SubCategory.findByIdAndUpdate(
            subCategoryId,
            { $push: { products: newProduct._id } },
            { new: true }
        ).catch((err) => console.log(err));

        if (!addToSubCategory) {
            res.status(404).json({ message: 'Failed to add product to subcategory' });
            return;
        }
    }

    // Add product in category if no sub category
    if (!subCategoryId) {
        const addToCategory = await Category.findByIdAndUpdate(
            categoryId,
            { $push: { products: newProduct._id } },
            { new: true }
        ).catch((err) => console.log(err));

        if (!addToCategory) {
            res.status(404).json({ message: 'Failed to add product to Category' });
            return;
        }
    }

    // Return the new product and a success message
    res.status(200).json({
        success: true,
        data: newProduct,
        message: "Product Created Successfully",
    });
});






// Update Product ---ADMIN
exports.updateProductDetails = asyncHandler(async (req, res, next) => {
    let {
        name,
        description,
        highlights,
        specifications,
        status,
        price,
        cuttedPrice,
        gst,
    } = req.body.formData;

    const {productId} = req.body;


    try {
        // Parse JSON strings to objects/arrays if they are strings
        if (typeof highlights === 'string') highlights = JSON.parse(highlights);
        if (typeof specifications === 'string') specifications = JSON.parse(specifications);
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON format",
        });
    }

    // Find product
    let product = await Product.findById({ _id: productId });

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    // Update product fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.highlights = highlights || product.highlights;
    product.specifications = specifications || product.specifications;
    product.price = price || product.price;
    product.cuttedPrice = cuttedPrice || product.cuttedPrice;
    product.status = status || product.status;
    product.gst = gst || product.gst;

    try {
        await product.save();

        // Populate related fields
        await product.populate([
            { path: 'category', model: 'Category' },
            { path: 'subCategory', model: 'SubCategory' },
            { path: 'reviews', model: 'RatingAndReview' }
        ]);
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }

    res.status(201).json({
        success: true,
        product
    });
});



// Update Product Images ---ADMIN
exports.updateProductImages = asyncHandler(async (req, res, next) => {

    const { productId } = req.body;

    // Ensure product ID is provided
    if (!productId) {
        return res.status(400).json({
            success: false,
            message: "Product ID is required",
        });
    }

    // Find product
    let product = await Product.findById(productId);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    // Check if themeImage and otherImages are provided in the request
    const { newThemeImage, newOtherImages } = req.files; // Assuming files are uploaded using 'themeImage' and 'otherImages'

    try {
        // Delete old themeImage from Cloudinary if provided
        if (newThemeImage && product.themeImage && product.themeImage.public_id) {
            await cloudinary.uploader.destroy(product?.themeImage?.public_id);
        }

        // Upload new themeImage to Cloudinary if provided
        if (newThemeImage) {
            const themeImageResult = await uploadImageToCloudinary(newThemeImage, process.env.PRODUCT_FOLDER_NAME, "auto:low");
            
            
            product.themeImage = {
                public_id: themeImageResult.public_id,
                url: themeImageResult.secure_url,
            };
        }

        // Delete old otherImages from Cloudinary if provided
        if (newOtherImages?.length && product?.otherImages?.length) {
            for (const image of product.otherImages) {
                await cloudinary.uploader.destroy(image.public_id);
            }
            product.otherImages = []; // Clear existing images
        }

        // Upload new otherImages to Cloudinary if provided
        if (newOtherImages && newOtherImages?.length) {
            for (const image of newOtherImages) {
                const imageResult = await uploadImageToCloudinary(image, process.env.PRODUCT_FOLDER_NAME, "auto:low");
                product.otherImages.push({
                    public_id: imageResult.public_id,
                    url: imageResult.secure_url,
                });
            }
        }

        await product.save();

        // Populate related fields
        product = await Product.findById(productId).populate([
            { path: 'category', model: 'Category' },
            { path: 'subCategory', model: 'SubCategory' },
            { path: 'reviews', model: 'RatingAndReview' }
        ]);

        res.status(201).json({
            success: true,
            product
        });

    } catch (error) {
        console.log(error)
        return next(new ErrorHandler(error.message, 400));
    }
});






// Delete Product ---ADMIN
exports.deleteProduct = asyncHandler(async (req, res, next) => {

    const { id } = req.params;

    // Find the product by ID
    const product = await Product.findById(id);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    // Delete product images from Cloudinary
    const deleteImage = async (image) => {
        await cloudinary.v2.uploader.destroy(image.public_id);
    };

    if (product.themeImage) {
        await deleteImage(product.themeImage);
    }

    if (product.otherImages && product.otherImages.length > 0) {
        await Promise.all(product.otherImages.map(deleteImage));
    }

    // Remove product from category and subcategory
    if (product.category) {
        await Category.findByIdAndUpdate(product.category, {
            $pull: { products: product._id }
        });
    }

    if (product.subCategory) {
        await SubCategory.findByIdAndUpdate(product.subCategory, {
            $pull: { products: product._id }
        });
    }

    // Delete the product
    await product.deleteOne();

    return res.status(200).json({
        message: "Product Deleted Successfully",
        success: true
    });
});








// Get all products
exports.allProducts = asyncHandler( async (req,res) => {

    const products = await Product.find().populate({path: "category"}).sort({ createdAt: -1 });

    return res.status(200).json({
        message: "Products fetched successfullly",
        products,
        success: true
    })

})


// Get single products
exports.productDetails = asyncHandler( async (req,res) => {

    const {id} = req.params;

    if(!id){
        return res.status(401).json({
            message: "Please provide product id.",
            success: false
        });
    }

    // Fetch product details with populated category, subcategory, and reviews
    const product = await Product.findOne({ _id: id })
    .populate({path: 'category'}) // Populate category with just name field
    .populate({path: 'subCategory'}) // Populate subcategory with just name field
    .populate({path: 'reviews'});

    return res.status(200).json({
        message: "Products fetched successfullly",
        product,
        success: true
    })

})




