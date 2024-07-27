const mongoose = require('mongoose');
const Decimal128 = mongoose.Schema.Types.Decimal128;
const { v4: uuidv4 } = require('uuid'); // Import UUID v4 generator

const paymentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer"
  },

  orderId:{
    type: String
  },

  paymentUuid: {
    type: String,
    default: uuidv4, // Generate UUID v4 as default value
    index: true, // Optional: Index the paymentUuid field for faster lookups
    unique: true, // Optional: Ensure paymentUuid is unique
  },

  paymentId: {
    type: String,
  },

  signature: {
    type: String,
  },

  amount: {
    type: Decimal128,
    required: true,
  },

  items:[
    {
      type: Object  
    }
  ],

  deliveryAddress:{
    type: Object
  },

  currency: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    default: 'pending',
  },

}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
