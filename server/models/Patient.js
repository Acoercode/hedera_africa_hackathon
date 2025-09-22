const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  // Basic patient information
  patientId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Demographics
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
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    required: true
  },
  
  // Contact information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Medical information
  medicalHistory: [{
    condition: String,
    diagnosisDate: Date,
    status: {
      type: String,
      enum: ['active', 'resolved', 'chronic']
    }
  }],
  
  // Hedera integration
  hederaAccountId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Consent management
  consentStatus: {
    type: String,
    enum: ['pending', 'granted', 'denied', 'revoked'],
    default: 'pending'
  },
  consentTimestamp: {
    type: Date
  },
  consentTransactionId: {
    type: String // Hedera transaction ID for consent
  },
  
  // Privacy and security
  dataEncryptionKey: {
    type: String,
    required: true
  },
  accessLog: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    action: String,
    requester: String,
    purpose: String,
    transactionId: String
  }],
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
patientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
patientSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Indexes for performance
patientSchema.index({ email: 1 });
patientSchema.index({ hederaAccountId: 1 });
patientSchema.index({ walletAddress: 1 });
patientSchema.index({ consentStatus: 1 });
patientSchema.index({ createdAt: -1 });

// Pre-save middleware
patientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
patientSchema.statics.findByHederaAccount = function(accountId) {
  return this.findOne({ hederaAccountId: accountId });
};

patientSchema.statics.findByWalletAddress = function(address) {
  return this.findOne({ walletAddress: address });
};

// Instance methods
patientSchema.methods.addAccessLog = function(action, requester, purpose, transactionId) {
  this.accessLog.push({
    action,
    requester,
    purpose,
    transactionId
  });
  return this.save();
};

patientSchema.methods.updateConsent = function(status, transactionId) {
  this.consentStatus = status;
  this.consentTimestamp = new Date();
  this.consentTransactionId = transactionId;
  return this.save();
};

module.exports = mongoose.model('Patient', patientSchema);
