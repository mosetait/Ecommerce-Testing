const mongoose = require("mongoose");

const dealsSchema = new mongoose.Schema({


    bestDeal : {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Product"
    },

    mostPopular: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Product"
    },

    newest: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Product"
    }


},{timestamps: true});

module.exports = mongoose.model("Deals" , dealsSchema);