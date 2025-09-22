const express = require('express');
const router = express.Router();
const GenomicData = require('../models/GenomicData');
const Patient = require('../models/Patient');
const Consent = require('../models/Consent');
const hederaService = require('../services/hederaService');
const incentiveService = require('../services/incentiveService');
const multer = require('multer');
const crypto = require('crypto');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// GET /api/genomic - Get all genomic data
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId, dataType } = req.query;
    const query = { isActive: true };
    
    if (patientId) {
      query.patientId = patientId;
    }
    
    if (dataType) {
      query.dataType = dataType;
    }

    const genomicData = await GenomicData.find(query)
      .select('-encryptionKey -variants -aiAnalysis')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await GenomicData.countDocuments(query);

    res.json({
      genomicData,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching genomic data:', error);
    res.status(500).json({ error: 'Failed to fetch genomic data' });
  }
});

// GET /api/genomic/:id - Get genomic data by ID
router.get('/:id', async (req, res) => {
  try {
    const genomicData = await GenomicData.findOne({ 
      dataId: req.params.id, 
      isActive: true 
    }).select('-encryptionKey');

    if (!genomicData) {
      return res.status(404).json({ error: 'Genomic data not found' });
    }

    res.json(genomicData);
  } catch (error) {
    console.error('Error fetching genomic data:', error);
    res.status(500).json({ error: 'Failed to fetch genomic data' });
  }
});

// GET /api/genomic/patient/:patientId - Get genomic data by patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const genomicData = await GenomicData.findByPatient(req.params.patientId)
      .select('-encryptionKey -variants -aiAnalysis');

    res.json(genomicData);
  } catch (error) {
    console.error('Error fetching patient genomic data:', error);
    res.status(500).json({ error: 'Failed to fetch patient genomic data' });
  }
});

// GET /api/genomic/nft/:tokenId/:serialNumber - Get genomic data by NFT
router.get('/nft/:tokenId/:serialNumber', async (req, res) => {
  try {
    const { tokenId, serialNumber } = req.params;
    const genomicData = await GenomicData.findByNFT(tokenId, serialNumber);

    if (!genomicData) {
      return res.status(404).json({ error: 'Genomic data NFT not found' });
    }

    // Remove sensitive data from response
    const response = genomicData.toObject();
    delete response.encryptionKey;
    delete response.variants;
    delete response.aiAnalysis;

    res.json(response);
  } catch (error) {
    console.error('Error fetching genomic data by NFT:', error);
    res.status(500).json({ error: 'Failed to fetch genomic data' });
  }
});

// POST /api/genomic - Upload new genomic data
router.post('/', upload.single('genomicFile'), async (req, res) => {
  try {
    const {
      patientId,
      dataType,
      sequencingPlatform,
      sequencingDate,
      qualityMetrics,
      variants = []
    } = req.body;

    // Validate required fields
    if (!patientId || !dataType || !sequencingPlatform || !sequencingDate || !req.file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if patient exists
    const patient = await Patient.findOne({ patientId, isActive: true });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check if patient has valid consent for data storage
    const validConsents = await Consent.findValidConsents(patientId, dataType, 'data_storage');
    if (validConsents.length === 0) {
      return res.status(403).json({ error: 'No valid consent found for data storage' });
    }

    // Generate unique data ID
    const dataId = `genomic_${patientId}_${Date.now()}`;
    
    // Calculate file hash
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    
    // Generate encryption key
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    
    // Parse quality metrics if provided
    let parsedQualityMetrics = {};
    if (qualityMetrics) {
      try {
        parsedQualityMetrics = JSON.parse(qualityMetrics);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid quality metrics format' });
      }
    }

    // Parse variants if provided
    let parsedVariants = [];
    if (variants.length > 0) {
      try {
        parsedVariants = Array.isArray(variants) ? variants : JSON.parse(variants);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid variants format' });
      }
    }

    // Create genomic data record
    const genomicData = new GenomicData({
      dataId,
      patientId,
      dataType,
      sequencingPlatform,
      sequencingDate: new Date(sequencingDate),
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileFormat: req.file.originalname.split('.').pop().toLowerCase(),
      fileHash,
      storageLocation: `encrypted_storage/${dataId}`,
      encryptionKey,
      qualityMetrics: parsedQualityMetrics,
      variants: parsedVariants,
      hederaTopicId: hederaService.getTopicInfo().genomicTopicId,
      accessLevel: 'private'
    });

    await genomicData.save();

    // Submit data hash to Hedera and create NFT
    try {
      // 1. Submit data access log to HCS
      const hederaResult = await hederaService.submitDataAccessLog({
        patientId,
        dataId,
        entityId: 'system',
        action: 'data_upload',
        purpose: 'genomic_data_storage',
        consentTransactionId: validConsents[0].consentTransactionId
      });

      // 2. Create genomic data NFT
      const nftResult = await hederaService.createGenomicDataNFT({
        dataId,
        patientId,
        dataType,
        fileHash,
        encryptionKey,
        accessLevel: 'private'
      });

      // 3. Encrypt genomic data for NFT metadata
      const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
      let encryptedData = cipher.update(JSON.stringify({
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileFormat: req.file.originalname.split('.').pop().toLowerCase(),
        qualityMetrics: parsedQualityMetrics,
        uploadTimestamp: new Date().toISOString()
      }), 'utf8', 'hex');
      encryptedData += cipher.final('hex');

      // 4. Mint genomic data NFT to patient
      const mintResult = await hederaService.mintGenomicDataNFT(
        nftResult.tokenId,
        patient.hederaAccountId,
        encryptedData
      );

      // 5. Update genomic data with all transaction IDs
      genomicData.dataHashTransactionId = hederaResult.transactionId;
      genomicData.genomicDataNFTTokenId = nftResult.tokenId;
      genomicData.genomicDataNFTSerialNumber = mintResult.serialNumber;
      genomicData.genomicDataNFTTransactionId = mintResult.transactionId;
      genomicData.nftMintedAt = new Date();
      genomicData.consentTransactionId = validConsents[0].consentTransactionId;
      await genomicData.save();

      // 6. Distribute incentive tokens
      try {
        const incentiveResult = await incentiveService.distributeIncentives(
          patient.hederaAccountId,
          'data_uploaded',
          dataType
        );
        console.log(`✅ Incentive distributed: ${incentiveResult.amount} GDI tokens`);
      } catch (incentiveError) {
        console.error('Failed to distribute incentives:', incentiveError);
        // Don't fail the entire request for incentive errors
      }

    } catch (hederaError) {
      console.error('Failed to submit to Hedera:', hederaError);
      // Continue without failing the upload
    }

    // Remove sensitive data from response
    const response = genomicData.toObject();
    delete response.encryptionKey;
    delete response.variants;
    delete response.aiAnalysis;

    res.status(201).json(response);
  } catch (error) {
    console.error('Error uploading genomic data:', error);
    res.status(500).json({ error: 'Failed to upload genomic data' });
  }
});

// PUT /api/genomic/:id/access - Grant access to genomic data
router.put('/:id/access', async (req, res) => {
  try {
    const { userId, accessType, purpose, consentTransactionId } = req.body;

    if (!userId || !accessType || !purpose) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const genomicData = await GenomicData.findOne({ 
      dataId: req.params.id, 
      isActive: true 
    });

    if (!genomicData) {
      return res.status(404).json({ error: 'Genomic data not found' });
    }

    // Grant access
    await genomicData.grantAccess(userId, accessType);

    // Add access log
    await genomicData.addAccessLog(userId, 'access_granted', purpose, consentTransactionId);

    // Submit access log to Hedera
    try {
      await hederaService.submitDataAccessLog({
        patientId: genomicData.patientId,
        dataId: genomicData.dataId,
        entityId: userId,
        action: 'access_granted',
        purpose,
        consentTransactionId
      });
    } catch (hederaError) {
      console.error('Failed to submit access log to Hedera:', hederaError);
    }

    res.json({ message: 'Access granted successfully' });
  } catch (error) {
    console.error('Error granting access:', error);
    res.status(500).json({ error: 'Failed to grant access' });
  }
});

// POST /api/genomic/:id/ai-analysis - Add AI analysis results
router.post('/:id/ai-analysis', async (req, res) => {
  try {
    const { analysisType, model, version, results, confidence } = req.body;

    if (!analysisType || !model || !results) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const genomicData = await GenomicData.findOne({ 
      dataId: req.params.id, 
      isActive: true 
    });

    if (!genomicData) {
      return res.status(404).json({ error: 'Genomic data not found' });
    }

    // Add AI analysis
    await genomicData.addAIAnalysis(analysisType, model, version, results, confidence);

    res.json({ message: 'AI analysis added successfully' });
  } catch (error) {
    console.error('Error adding AI analysis:', error);
    res.status(500).json({ error: 'Failed to add AI analysis' });
  }
});

// GET /api/genomic/:id/ai-analysis - Get AI analysis results
router.get('/:id/ai-analysis', async (req, res) => {
  try {
    const genomicData = await GenomicData.findOne({ 
      dataId: req.params.id, 
      isActive: true 
    }).select('aiAnalysis');

    if (!genomicData) {
      return res.status(404).json({ error: 'Genomic data not found' });
    }

    res.json({ aiAnalysis: genomicData.aiAnalysis });
  } catch (error) {
    console.error('Error fetching AI analysis:', error);
    res.status(500).json({ error: 'Failed to fetch AI analysis' });
  }
});

// GET /api/genomic/:id/access-log - Get access log
router.get('/:id/access-log', async (req, res) => {
  try {
    const genomicData = await GenomicData.findOne({ 
      dataId: req.params.id, 
      isActive: true 
    }).select('accessLog');

    if (!genomicData) {
      return res.status(404).json({ error: 'Genomic data not found' });
    }

    res.json({ accessLog: genomicData.accessLog });
  } catch (error) {
    console.error('Error fetching access log:', error);
    res.status(500).json({ error: 'Failed to fetch access log' });
  }
});

// DELETE /api/genomic/:id - Soft delete genomic data
router.delete('/:id', async (req, res) => {
  try {
    const genomicData = await GenomicData.findOne({ 
      dataId: req.params.id, 
      isActive: true 
    });

    if (!genomicData) {
      return res.status(404).json({ error: 'Genomic data not found' });
    }

    // Soft delete
    genomicData.isActive = false;
    await genomicData.save();

    res.json({ message: 'Genomic data deleted successfully' });
  } catch (error) {
    console.error('Error deleting genomic data:', error);
    res.status(500).json({ error: 'Failed to delete genomic data' });
  }
});

module.exports = router;