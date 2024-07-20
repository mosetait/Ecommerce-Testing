const mongoose = require('mongoose');
const Decimal128 = mongoose.Schema.Types.Decimal128;


const categorySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        unique: true,  // Ensure category names are unique
        trim: true     // Trim whitespace
    },


    images: [
        {
            publicId: {
                type: String,
                required: true
            },
            secureUrl: {
                type: String,
                required: true
            }
        }
    ],

    products: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Product",
    }
    ,
    
    subCategories:{
            type: [mongoose.Schema.Types.ObjectId],
            ref: "SubCategory",  // Use self-reference for hierarchical categories
    }



}, { timestamps: true });  // Enable timestamps





// Export the Category model
module.exports = mongoose.model("Category", categorySchema);
