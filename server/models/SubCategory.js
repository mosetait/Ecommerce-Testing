const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
    },

    products: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Product"
    }
    ,

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    }

}, { timestamps: true });  // Enable timestamps




// Export the SubCategory model
module.exports = mongoose.model("SubCategory", subCategorySchema);
