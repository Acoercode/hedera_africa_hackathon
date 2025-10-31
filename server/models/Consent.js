const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema({
  // Consent identification
  consentId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Patient reference
  patientId: {
    type: String,
    required: true,
    ref: 'Patient'
  },
  
  // Consent details
  consentType: {
    type: String,
    enum: [
      'genomic_analysis',
      'data_sharing',
      'research_participation',
      'clinical_trial',
      'data_storage',
      'ai_analysis',
      'commercial_use',
      'genomic_passport',  // New: for genomic passport NFTs
      'data_sync'  // New: for data synchronization consent
    ],
    required: true
  },
  
  consentStatus: {
    type: String,
    enum: ['pending', 'granted', 'denied', 'revoked', 'expired'],
    default: 'pending'
  },
  
  // Consent scope
  dataTypes: [{
    type: String,
    enum: ['whole_genome', 'exome', 'targeted_panel', 'snp_array', 'rna_seq', 'methylation', 'genomic_passport']
  }],
  
  purposes: [{
    type: String,
    enum: [
      'research',
      'clinical_care',
      'drug_development',
      'population_studies',
      'disease_prediction',
      'ancestry_analysis',
      'pharmacogenomics',
      'data_ownership_proof',  // New: for genomic passport NFTs
      'data_synchronization'  // New: for data sync consent
    ]
  }],
  
  // Time limits
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date
  },
  
  // Consent text and versioning
  consentText: {
    type: String,
    required: true
  },
  consentVersion: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'en'
  },
  
  // Patient signature and verification
  patientSignature: {
    type: String,
    required: true
  },
  signatureTimestamp: {
    type: Date,
    required: true
  },
  signatureMethod: {
    type: String,
    enum: ['digital', 'biometric', 'wallet_signature'],
    required: true
  },
  
  // Hedera blockchain integration
  hederaAccountId: {
    type: String,
    required: true
  },
  consentHash: {
    type: String,
    required: true
  },
  consentTransactionId: {
    type: String,
    required: true,
    unique: true
  },
  topicId: {
    type: String,
    required: true
  },
  
  // NFT integration
  consentNFTTokenId: {
    type: String
  },
  consentNFTSerialNumber: {
    type: String
  },
  consentNFTTransactionId: {
    type: String
  },
  nftMintedAt: {
    type: Date
  },
  
  // Access control
  authorizedEntities: [{
    entityId: String,
    entityType: {
      type: String,
      enum: ['researcher', 'clinician', 'institution', 'pharma_company', 'ai_system']
    },
    accessScope: [String],
    grantedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],
  
  // Revocation information
  revocationReason: String,
  revokedAt: Date,
  revokedBy: String,
  revocationTransactionId: String,
  
  // Audit trail
  accessLog: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    entityId: String,
    action: String,
    dataAccessed: String,
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

// Virtual for consent validity
consentSchema.virtual('isValid').get(function() {
  if (this.consentStatus !== 'granted') return false;
  if (this.validUntil && new Date() > this.validUntil) return false;
  return true;
});

// Virtual for days until expiration
consentSchema.virtual('daysUntilExpiration').get(function() {
  if (!this.validUntil) return null;
  const now = new Date();
  const diffTime = this.validUntil - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes removed to prevent automatic creation

// Pre-save middleware
consentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
consentSchema.statics.findByPatient = function(patientId) {
  return this.find({ patientId, isActive: true });
};

consentSchema.statics.findByStatus = function(status) {
  return this.find({ consentStatus: status, isActive: true });
};

consentSchema.statics.findByTransactionId = function(transactionId) {
  return this.findOne({ consentTransactionId: transactionId });
};

consentSchema.statics.findByNFT = function(tokenId, serialNumber) {
  return this.findOne({ 
    consentNFTTokenId: tokenId, 
    consentNFTSerialNumber: serialNumber 
  });
};

consentSchema.statics.findValidConsents = function(patientId, dataType, purpose) {
  const query = {
    patientId,
    consentStatus: 'granted',
    isActive: true,
    validFrom: { $lte: new Date() }
  };
  
  if (dataType) {
    query.dataTypes = { $in: [dataType] };
  }
  
  if (purpose) {
    query.purposes = { $in: [purpose] };
  }
  
  return this.find(query);
};

// Instance methods
consentSchema.methods.addAccessLog = function(entityId, action, dataAccessed, purpose, transactionId) {
  this.accessLog.push({
    entityId,
    action,
    dataAccessed,
    purpose,
    transactionId
  });
  return this.save();
};

consentSchema.methods.revoke = function(reason, revokedBy, transactionId) {
  this.consentStatus = 'revoked';
  this.revocationReason = reason;
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  this.revocationTransactionId = transactionId;
  return this.save();
};

consentSchema.methods.grantAccess = function(entityId, entityType, accessScope, expiresAt) {
  const existingAccess = this.authorizedEntities.find(entity => entity.entityId === entityId);
  if (existingAccess) {
    existingAccess.accessScope = accessScope;
    existingAccess.expiresAt = expiresAt;
    existingAccess.grantedAt = new Date();
  } else {
    this.authorizedEntities.push({
      entityId,
      entityType,
      accessScope,
      grantedAt: new Date(),
      expiresAt
    });
  }
  return this.save();
};

module.exports = mongoose.model('Consent', consentSchema);
