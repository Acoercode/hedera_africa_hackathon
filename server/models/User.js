const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  iHopeId: {
    type: String,
    required: true,
    unique: true
  },
  hederaAccountId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Static method to find user by Hedera account ID
userSchema.statics.findByHederaAccount = function(hederaAccountId) {
  return this.findOne({ hederaAccountId, isActive: true });
};

// Static method to find user by iHope ID
userSchema.statics.findByIHopeId = function(iHopeId) {
  return this.findOne({ iHopeId, isActive: true });
};

// Static method to verify date of birth
userSchema.statics.verifyDateOfBirth = function(iHopeId, dateOfBirth) {
  return this.findOne({ 
    iHopeId, 
    dateOfBirth: new Date(dateOfBirth),
    isActive: true 
  });
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
