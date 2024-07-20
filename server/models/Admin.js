const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

// Define the Admin schema
const AdminSchema = new Schema({

  firstName: {
    type: String,
    required: true,
    trim: true
  },

  lastName: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['admin', 'subAdmin'],
    default: 'admin'
  },

  isActive: {
    type: Boolean,
    default: true
  },

}, {timestamps: true});



// Middleware to hash password before saving
AdminSchema.pre('save', async function(next) {

  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});


// Method to compare password for authentication
AdminSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};


// Create the Admin model
const Admin = mongoose.model('Admin', AdminSchema);


module.exports = Admin;
