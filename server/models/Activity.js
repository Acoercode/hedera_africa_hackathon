const mongoose = require('mongoose');
const crypto = require('crypto');

const activitySchema = new mongoose.Schema({
  // Activity identification
  activityId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // User reference
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Activity details
  activityName: {
    type: String,
    required: true,
    index: true
  },
  activityDescription: {
    type: String,
    required: true
  },
  activityType: {
    type: String,
    enum: ['consent', 'data', 'reward', 'security', 'ai', 'sharing'],
    required: true,
    index: true
  },
  
  // Hedera integration
  transactionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Encrypted metadata (for any personal data)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ activityType: 1, timestamp: -1 });
activitySchema.index({ transactionId: 1 });

// Pre-save middleware
activitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
activitySchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

activitySchema.statics.findByActivityType = function(activityType, limit = 50) {
  return this.find({ activityType })
    .sort({ timestamp: -1 })
    .limit(limit);
};

activitySchema.statics.findByTransactionId = function(transactionId) {
  return this.findOne({ transactionId });
};

// Instance methods
activitySchema.methods.encryptMetadata = function(encryptionKey) {
  if (this.metadata && Object.keys(this.metadata).length > 0) {
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
    let encrypted = cipher.update(JSON.stringify(this.metadata), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    this.metadata = { encrypted };
    this.isEncrypted = true;
  }
  return this;
};

activitySchema.methods.decryptMetadata = function(encryptionKey) {
  if (this.isEncrypted && this.metadata.encrypted) {
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    let decrypted = decipher.update(this.metadata.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    this.metadata = JSON.parse(decrypted);
    this.isEncrypted = false;
  }
  return this;
};

module.exports = mongoose.model('Activity', activitySchema);
