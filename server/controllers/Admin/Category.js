const asyncHandler = require("../../middlewares/asyncHandler");
const Category = require("../../models/Category");
const SubCategory = require("../../models/SubCategory");
const { uploadImageToCloudinary } = require("../../utils/imageUploader");
const cloudinary = require('cloudinary').v2;
const Product = require("../../models/Product");



// create category
exports.createCategory = asyncHandler( async (req,res) => {


        const { name } = req.body;
  
        const images = req?.files?.images;


        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Name is required for creating a category.",
            });
        }


        // check if category already exist
        const existingCategory = await Category.findOne({name});

        if(existingCategory){
          return res.status(200).json({
            message: "Category already exist.",
            success: false
          })
        }

  
        const uploadImagesToCloudinary = async (images) => {
  
          // Check if images is an array, if not, create an array with the single image
          const imagesArray = Array.isArray(images) ? images : [images];
        
          if (imagesArray.length === 0) {
            return []; // No images to upload
          }
        
          // Handle single image upload differently
          if (imagesArray.length === 1) {
            const result = await uploadImageToCloudinary(imagesArray[0], process.env.PRODUCT_FOLDER_NAME);
            return [{
              publicId: result.public_id,
              secureUrl: result.secure_url,
            }];
          }
        
          // Upload multiple images
          const uploadedImages = await Promise.all(
            imagesArray.map(async (image) => {
              const result = await uploadImageToCloudinary(image, process.env.PRODUCT_FOLDER_NAME);

              return {
                publicId: result.public_id,
                secureUrl: result.secure_url,
              };
            })
          );
        
          return uploadedImages;
        };
        
        
        let uploadedImages = [];
        if(images){
          uploadedImages = await uploadImagesToCloudinary(images);
        }
        

        const categoryDetails = await Category.create({
            name,
            images: uploadedImages,
            products: [],
            subCategories:[]
        });

        const categories = await Category.find()
        .populate('products')
        .populate('subCategories');  
  
        return res.status(200).json({
            success: true,
            message: "Category Created Successfully",
            categoryDetails,
            categories
        });

})





// update category - not integrated yet
exports.updateCategory = asyncHandler( async (req,res) => {

    const {id , formData} = req.body; // Assuming you get the category ID from the route params
    const { name} = req.body;


    // Check if the category ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required for updating a category.",
      });
    }

    // Find the existing category by ID
    const existingCategory = await Category.findById({_id: id});

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // Delete previous images from Cloudinary
    const deleteImagesPromises = existingCategory.images.map(async (image) => {
      await cloudinary.uploader.destroy(image.publicId);
      console.log("Image deleted successfully");
    });

    await Promise.all(deleteImagesPromises);


    let uploadedImages = [];

    if(req?.files?.images){
      // Upload new images to Cloudinary
      const imagesArray = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

      uploadedImages = await Promise.all(
        imagesArray.map(async (image) => {
          const result = await uploadImageToCloudinary(image, process.env.PRODUCT_FOLDER_NAME);
          return {
            publicId: result.public_id,
            secureUrl: result.secure_url,
          };
        })
      );
    }

    // Update category details with new name and images
    const updatedCategory = await Category.findByIdAndUpdate(

      categoryId,

      {
        name: name || existingCategory.name, // Update name if provided, otherwise keep the existing name
        images: uploadedImages.length > 0 ? uploadedImages : existingCategory.images, // Update images only if new images are provided
      },

      { new: true }

    );

    return res.status(200).json({
      success: true,
      message: "Category Updated Successfully",
      categoryDetails: updatedCategory,
    });

})






// Function to delete images from cloud storage
const deleteImagesFromCloud = async (images) => {
  for (const { publicId } of images) {
      await cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
              console.error('Error deleting image from cloud:', error);
          } else {
              console.log('Image deleted from cloud:', result);
          }
      });
  }
};





// delete category - 
exports.deleteCategory = asyncHandler(async (req, res) => {

  const { id } = req.params;

  if (!id) {
      return res.status(401).json({
          message: "Category Id required.",
          success: false
      });
  }

  // Find category
  const category = await Category.findOne({ _id: id });

  if (!category) {
      return res.status(404).json({
          message: "Category not found.",
          success: false
      });
  }

  // Find and delete all subcategories and their products
  const subCategories = await SubCategory.find({ category: category._id });

  for (const subCategory of subCategories) {

      const subCategoryProducts = await Product.find({ subCategory: subCategory._id });

      for (const product of subCategoryProducts) {

          // Delete product images
          if (product.themeImage) {
              await deleteImagesFromCloud([{ publicId: product.themeImage }]);
          }
          if (product.otherImages && product.otherImages.length > 0) {
              await deleteImagesFromCloud(product.otherImages);
          }

          // Delete product
          await Product.deleteOne({ _id: product._id });
      }

      // Delete subcategory
      await SubCategory.deleteOne({ _id: subCategory._id });
  }


  // Find and delete all products directly under the category
  const categoryProducts = await Product.find({ category: category._id });

  for (const product of categoryProducts) {

      // Delete product images
      if (product.themeImage) {
          await deleteImagesFromCloud([{ publicId: product.themeImage }]);
      }
      if (product.otherImages && product.otherImages.length > 0) {
          await deleteImagesFromCloud(product.otherImages);
      }

      // Delete product
      await Product.deleteOne({ _id: product._id });
  }


  // Delete category images
  if (category.images && category.images.length > 0) {
      await deleteImagesFromCloud(category.images);
  }

  // Delete the category itself
  await Category.deleteOne({ _id: category._id });

  const categories = await Category.find()
  .populate('products')
  .populate('subCategories'); 


  return res.status(200).json({
      message: "Category and all associated subcategories, products, and images deleted successfully.",
      success: true,
      categories
  });
});











// create sub category
exports.createSubCategory = asyncHandler( async (req,res) => {


    const { name , categoryId } = req.body;


    if (!name , !categoryId) {
        return res.status(400).json({
            success: false,
            message: "Name and Category is required for creating a sub category.",
        });
    }

    // check if sub category exist or not with the same name
    const existingSubCategory = await SubCategory.findOne({name});

    console.log(existingSubCategory)

    if(existingSubCategory){
      return res.status(401).json({
        success: false,
        message: "Sub Category already exist",
      });
    }

    let categoryDetails = await Category.findById({_id: categoryId});

    if(!categoryDetails){
      return res.status(401).json({
        success: false,
        message: "Category not found."
      })
    }

    const newSubCat = await SubCategory.create({
      name,
      products:[],
      category : categoryId
    })

    let updateCategoryDetails = await Category.findByIdAndUpdate(
      {_id : categoryId},
      {$push : {subCategories: newSubCat._id }    },
      {new: true}
    );
    
    const categories = await Category.find()
    .populate('products')
    .populate('subCategories'); 

    return res.status(201).json({
      success: true,
      message: 'New Sub-Category has been created.',
      updateCategoryDetails,
      newSubCat,
      categories
  })

})





// update subcategory
exports.updateSubCategory = asyncHandler(async (req, res) => {

  const { subCategoryId, name } = req.body;

  if (!subCategoryId) {
      return res.status(401).json({
          message: "Sub Category id required.",
          success: false
      });
  }

  if (!name) {
      return res.status(401).json({
          message: "Sub Category name required.",
          success: false
      });
  }

  // Find subcategory by ID
  const existingSubCategory = await SubCategory.findOne({ _id: subCategoryId });

  if (!existingSubCategory) {
      return res.status(404).json({
          message: "Sub Category not found.",
          success: false
      });
  }

  // Check if another subcategory with the same name exists
  const subCategoryWithSameName = await SubCategory.findOne({ name });

  if (subCategoryWithSameName) {
      return res.status(409).json({
          message: "A Sub Category with this name already exists.",
          success: false
      });
  }

  // Update subcategory name
  existingSubCategory.name = name;
  await existingSubCategory.save();

  return res.status(200).json({
      message: "Sub Category name updated successfully.",
      success: true,
      subCategory: existingSubCategory
  });
});






// delete subcategory
exports.deleteSubCategory = asyncHandler(async (req, res) => {

  const { id } = req.params;

  if (!id) {
      return res.status(401).json({
          message: "Sub Category id required.",
          success: false
      });
  }

  // Find subcategory by ID
  const existingSubCategory = await SubCategory.findOne({ _id: id });

  if (!existingSubCategory) {
      return res.status(404).json({
          message: "Sub Category not found.",
          success: false
      });
  }


  // find respective category
  const existingCategory = await Category.findOne({ _id: existingSubCategory.category });

  if (!existingCategory) {
      return res.status(404).json({
          message: "Category not found of Sub Category.",
          success: false
      });
  }


  // Find and delete all products in the subcategory
  const subCategoryProducts = await Product.find({ subCategory: id });

  for (const product of subCategoryProducts) {

      // Delete product images
      if (product.themeImage) {
          await deleteImagesFromCloud([{ publicId: product.themeImage }]);
      }

      if (product.otherImages && product.otherImages.length > 0) {
          await deleteImagesFromCloud(product.otherImages);
      }


      // Delete product
      await Product.deleteOne({ _id: product._id });
  }


  // Delete the subcategory itself
  await SubCategory.deleteOne({ _id: id });
  


  // delete subcategory from category.subCategories

  existingCategory.subCategories = existingCategory.subCategories.filter(
    (subCategory) => subCategory.toString() !== id
  );

  await existingCategory.save();

  const categories = await Category.find()
  .populate('products')
  .populate('subCategories'); 

  return res.status(200).json({
      message: "Sub Category and all associated products and images deleted successfully.",
      success: true,
      categories
  });
});











// Get all categories
exports.allCategories = asyncHandler(async (req, res) => {
  
  const categories = await Category.find().sort({ createdAt: -1 })
      .populate({
          path: 'products',
          model: 'Product'
      })
      .populate({
          path: 'subCategories',
          model: 'SubCategory',
          populate: {
              path: 'products',
              model: 'Product'
          }
      });

  return res.status(200).json({
      message: "Categories fetched successfully",
      categories,
      success: true
  });
});