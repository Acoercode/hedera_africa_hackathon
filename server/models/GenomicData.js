const mongoose = require('mongoose');

const genomicDataSchema = new mongoose.Schema({
  // Patient reference
  patientId: {
    type: String,
    required: true,
    index: true,
    ref: 'Patient'
  },
  
  // Data identification
  dataId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Data type and source
  dataType: {
    type: String,
    enum: ['whole_genome', 'exome', 'targeted_panel', 'snp_array', 'rna_seq', 'methylation'],
    required: true
  },
  sequencingPlatform: {
    type: String,
    required: true
  },
  sequencingDate: {
    type: Date,
    required: true
  },
  
  // File information
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },
  fileFormat: {
    type: String,
    enum: ['fastq', 'bam', 'vcf', 'gff', 'bed'],
    required: true
  },
  fileHash: {
    type: String,
    required: true,
    index: true
  },
  
  // Data location and encryption
  storageLocation: {
    type: String,
    required: true
  },
  encryptionKey: {
    type: String,
    required: true
  },
  isEncrypted: {
    type: Boolean,
    default: true
  },
  
  // Quality metrics
  qualityMetrics: {
    coverage: Number,
    meanQuality: Number,
    completeness: Number,
    contamination: Number,
    duplicationRate: Number
  },
  
  // Variant information
  variants: [{
    chromosome: String,
    position: Number,
    reference: String,
    alternate: String,
    variantType: {
      type: String,
      enum: ['snp', 'indel', 'sv', 'cnv']
    },
    quality: Number,
    clinicalSignificance: {
      type: String,
      enum: ['pathogenic', 'likely_pathogenic', 'uncertain_significance', 'likely_benign', 'benign']
    },
    gene: String,
    transcript: String,
    proteinChange: String
  }],
  
  // Consent and access control
  consentRequired: {
    type: Boolean,
    default: true
  },
  accessLevel: {
    type: String,
    enum: ['public', 'restricted', 'private'],
    default: 'private'
  },
  authorizedUsers: [{
    userId: String,
    accessType: {
      type: String,
      enum: ['read', 'write', 'admin']
    },
    grantedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Hedera integration
  hederaTopicId: {
    type: String,
    required: true
  },
  dataHashTransactionId: {
    type: String // Transaction ID when data hash was anchored to Hedera
  },
  consentTransactionId: {
    type: String // Transaction ID for consent to use this data
  },
  
  // NFT integration
  genomicDataNFTTokenId: {
    type: String,
    index: true
  },
  genomicDataNFTSerialNumber: {
    type: String,
    index: true
  },
  genomicDataNFTTransactionId: {
    type: String,
    index: true
  },
  nftMintedAt: {
    type: Date
  },
  
  // AI analysis results
  aiAnalysis: [{
    analysisType: {
      type: String,
      enum: ['disease_prediction', 'drug_response', 'ancestry', 'traits', 'pharmacogenomics']
    },
    model: String,
    version: String,
    results: mongoose.Schema.Types.Mixed,
    confidence: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Audit trail
  accessLog: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    userId: String,
    action: String,
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

// Indexes for performance
genomicDataSchema.index({ patientId: 1, dataType: 1 });
genomicDataSchema.index({ fileHash: 1 });
genomicDataSchema.index({ hederaTopicId: 1 });
genomicDataSchema.index({ accessLevel: 1 });
genomicDataSchema.index({ createdAt: -1 });

// Pre-save middleware
genomicDataSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
genomicDataSchema.statics.findByPatient = function(patientId) {
  return this.find({ patientId, isActive: true });
};

genomicDataSchema.statics.findByDataType = function(dataType) {
  return this.find({ dataType, isActive: true });
};

genomicDataSchema.statics.findByFileHash = function(hash) {
  return this.findOne({ fileHash: hash });
};

genomicDataSchema.statics.findByNFT = function(tokenId, serialNumber) {
  return this.findOne({ 
    genomicDataNFTTokenId: tokenId, 
    genomicDataNFTSerialNumber: serialNumber 
  });
};

// Instance methods
genomicDataSchema.methods.addAccessLog = function(userId, action, purpose, transactionId) {
  this.accessLog.push({
    userId,
    action,
    purpose,
    transactionId
  });
  return this.save();
};

genomicDataSchema.methods.addAIAnalysis = function(analysisType, model, version, results, confidence) {
  this.aiAnalysis.push({
    analysisType,
    model,
    version,
    results,
    confidence
  });
  return this.save();
};

genomicDataSchema.methods.grantAccess = function(userId, accessType) {
  const existingAccess = this.authorizedUsers.find(user => user.userId === userId);
  if (existingAccess) {
    existingAccess.accessType = accessType;
    existingAccess.grantedAt = new Date();
  } else {
    this.authorizedUsers.push({
      userId,
      accessType,
      grantedAt: new Date()
    });
  }
  return this.save();
};

module.exports = mongoose.model('GenomicData', genomicDataSchema);
