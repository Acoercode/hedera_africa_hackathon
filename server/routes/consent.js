const express = require('express');
const router = express.Router();
const Consent = require('../models/Consent');
const Patient = require('../models/Patient');
const hederaService = require('../services/hederaService');
const incentiveService = require('../services/incentiveService');
const { v4: uuidv4 } = require('uuid');

// GET /api/consent - Get all consents
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId, status, type } = req.query;
    const query = { isActive: true };
    
    if (patientId) {
      query.patientId = patientId;
    }
    
    if (status) {
      query.consentStatus = status;
    }
    
    if (type) {
      query.consentType = type;
    }

    const consents = await Consent.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Consent.countDocuments(query);

    res.json({
      consents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching consents:', error);
    res.status(500).json({ error: 'Failed to fetch consents' });
  }
});

// GET /api/consent/:id - Get consent by ID
router.get('/:id', async (req, res) => {
  try {
    const consent = await Consent.findOne({ 
      consentId: req.params.id, 
      isActive: true 
    });

    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    res.json(consent);
  } catch (error) {
    console.error('Error fetching consent:', error);
    res.status(500).json({ error: 'Failed to fetch consent' });
  }
});

// GET /api/consent/patient/:patientId - Get consents by patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const consents = await Consent.findByPatient(req.params.patientId);
    res.json(consents);
  } catch (error) {
    console.error('Error fetching patient consents:', error);
    res.status(500).json({ error: 'Failed to fetch patient consents' });
  }
});

// GET /api/consent/transaction/:transactionId - Get consent by transaction ID
router.get('/transaction/:transactionId', async (req, res) => {
  try {
    const consent = await Consent.findByTransactionId(req.params.transactionId);

    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    res.json(consent);
  } catch (error) {
    console.error('Error fetching consent by transaction:', error);
    res.status(500).json({ error: 'Failed to fetch consent' });
  }
});

// GET /api/consent/nft/:tokenId/:serialNumber - Get consent by NFT
router.get('/nft/:tokenId/:serialNumber', async (req, res) => {
  try {
    const { tokenId, serialNumber } = req.params;
    const consent = await Consent.findByNFT(tokenId, serialNumber);

    if (!consent) {
      return res.status(404).json({ error: 'Consent NFT not found' });
    }

    res.json(consent);
  } catch (error) {
    console.error('Error fetching consent by NFT:', error);
    res.status(500).json({ error: 'Failed to fetch consent' });
  }
});

// POST /api/consent/verify-nft - Verify consent NFT
router.post('/verify-nft', async (req, res) => {
  try {
    const { tokenId, serialNumber, patientId } = req.body;

    if (!tokenId || !serialNumber || !patientId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify NFT on blockchain
    const verification = await hederaService.verifyConsentNFT(tokenId, serialNumber, patientId);
    
    // Get consent record
    const consent = await Consent.findByNFT(tokenId, serialNumber);

    res.json({
      verification,
      consent: consent || null,
      message: verification.valid ? 'Consent NFT is valid' : `Consent NFT is invalid: ${verification.reason}`
    });
  } catch (error) {
    console.error('Error verifying consent NFT:', error);
    res.status(500).json({ error: 'Failed to verify consent NFT' });
  }
});

// POST /api/consent - Create new consent
router.post('/', async (req, res) => {
  try {
    const {
      patientId,
      consentType,
      dataTypes,
      purposes,
      validFrom,
      validUntil,
      consentText,
      consentVersion,
      language,
      patientSignature,
      signatureMethod,
      hederaAccountId
    } = req.body;

    // Validate required fields
    if (!patientId || !consentType || !dataTypes || !purposes || !validFrom || 
        !consentText || !consentVersion || !patientSignature || !signatureMethod || !hederaAccountId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if patient exists
    const patient = await Patient.findOne({ patientId, isActive: true });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Generate unique consent ID
    const consentId = `consent_${patientId}_${Date.now()}`;
    
    // Create consent hash
    const consentString = JSON.stringify({
      patientId,
      consentType,
      dataTypes,
      purposes,
      validFrom,
      validUntil,
      timestamp: new Date().toISOString()
    });
    
    const consentHash = require('crypto').createHash('sha256').update(consentString).digest('hex');

    // Create consent record
    const consent = new Consent({
      consentId,
      patientId,
      consentType,
      dataTypes,
      purposes,
      validFrom: new Date(validFrom),
      validUntil: validUntil ? new Date(validUntil) : null,
      consentText,
      consentVersion,
      language,
      patientSignature,
      signatureTimestamp: new Date(),
      signatureMethod,
      hederaAccountId,
      consentHash,
      consentTransactionId: 'pending', // Will be updated after Hedera submission
      topicId: hederaService.getTopicInfo().consentTopicId,
      consentStatus: 'pending'
    });

    await consent.save();

    // Submit consent hash to Hedera and create NFT
    try {
      // 1. Submit consent hash to HCS
      const hederaResult = await hederaService.submitConsentHash({
        patientId,
        consentId,
        consentType,
        dataTypes,
        purposes,
        validFrom: consent.validFrom,
        validUntil: consent.validUntil,
        patientSignature
      });

      // 2. Create consent NFT
      const nftResult = await hederaService.createConsentNFT({
        consentId,
        patientId,
        consentType,
        dataTypes,
        purposes,
        validFrom: consent.validFrom,
        validUntil: consent.validUntil
      });

      // 3. Mint consent NFT to patient
      const mintResult = await hederaService.mintConsentNFT(
        nftResult.tokenId,
        hederaAccountId,
        consentHash
      );

      // 4. Update consent with all transaction IDs
      consent.consentTransactionId = hederaResult.transactionId;
      consent.consentNFTTokenId = nftResult.tokenId;
      consent.consentNFTSerialNumber = mintResult.serialNumber;
      consent.consentNFTTransactionId = mintResult.transactionId;
      consent.nftMintedAt = new Date();
      consent.consentStatus = 'granted';
      await consent.save();

      // 5. Update patient consent status
      await patient.updateConsent('granted', hederaResult.transactionId);

      // 6. Distribute incentive tokens
      try {
        const incentiveResult = await incentiveService.distributeIncentives(
          hederaAccountId,
          'consent_provided',
          dataTypes[0] || 'genomic_analysis'
        );
        console.log(`✅ Incentive distributed: ${incentiveResult.amount} GDI tokens`);
      } catch (incentiveError) {
        console.error('Failed to distribute incentives:', incentiveError);
        // Don't fail the entire request for incentive errors
      }

      res.status(201).json({
        ...consent.toObject(),
        hederaResult,
        nftResult,
        mintResult,
        message: 'Consent created, NFT minted, and incentives distributed successfully!'
      });
    } catch (hederaError) {
      console.error('Failed to submit to Hedera:', hederaError);
      
      // Still save the consent but mark as pending
      consent.consentStatus = 'pending';
      await consent.save();
      
      res.status(201).json({
        ...consent.toObject(),
        error: 'Consent created but not yet submitted to blockchain'
      });
    }
  } catch (error) {
    console.error('Error creating consent:', error);
    res.status(500).json({ error: 'Failed to create consent' });
  }
});

// PUT /api/consent/:id/revoke - Revoke consent
router.put('/:id/revoke', async (req, res) => {
  try {
    const { reason, revokedBy, transactionId } = req.body;

    if (!reason || !revokedBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const consent = await Consent.findOne({ 
      consentId: req.params.id, 
      isActive: true 
    });

    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    if (consent.consentStatus === 'revoked') {
      return res.status(400).json({ error: 'Consent already revoked' });
    }

    // Revoke consent
    await consent.revoke(reason, revokedBy, transactionId);

    // Update patient consent status
    const patient = await Patient.findOne({ patientId: consent.patientId });
    if (patient) {
      await patient.updateConsent('revoked', transactionId);
    }

    res.json({ message: 'Consent revoked successfully', consent });
  } catch (error) {
    console.error('Error revoking consent:', error);
    res.status(500).json({ error: 'Failed to revoke consent' });
  }
});

// PUT /api/consent/:id/access - Grant access to authorized entity
router.put('/:id/access', async (req, res) => {
  try {
    const { entityId, entityType, accessScope, expiresAt } = req.body;

    if (!entityId || !entityType || !accessScope) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const consent = await Consent.findOne({ 
      consentId: req.params.id, 
      isActive: true 
    });

    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    if (!consent.isValid) {
      return res.status(400).json({ error: 'Consent is not valid' });
    }

    // Grant access
    await consent.grantAccess(entityId, entityType, accessScope, expiresAt ? new Date(expiresAt) : null);

    res.json({ message: 'Access granted successfully' });
  } catch (error) {
    console.error('Error granting access:', error);
    res.status(500).json({ error: 'Failed to grant access' });
  }
});

// GET /api/consent/:id/access-log - Get consent access log
router.get('/:id/access-log', async (req, res) => {
  try {
    const consent = await Consent.findOne({ 
      consentId: req.params.id, 
      isActive: true 
    }).select('accessLog');

    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    res.json({ accessLog: consent.accessLog });
  } catch (error) {
    console.error('Error fetching consent access log:', error);
    res.status(500).json({ error: 'Failed to fetch access log' });
  }
});

// POST /api/consent/:id/access-log - Add access log entry
router.post('/:id/access-log', async (req, res) => {
  try {
    const { entityId, action, dataAccessed, purpose, transactionId } = req.body;

    if (!entityId || !action || !purpose) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const consent = await Consent.findOne({ 
      consentId: req.params.id, 
      isActive: true 
    });

    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    // Add access log
    await consent.addAccessLog(entityId, action, dataAccessed, purpose, transactionId);

    res.json({ message: 'Access log added successfully' });
  } catch (error) {
    console.error('Error adding access log:', error);
    res.status(500).json({ error: 'Failed to add access log' });
  }
});

// GET /api/consent/verify/:transactionId - Verify consent on blockchain
router.get('/verify/:transactionId', async (req, res) => {
  try {
    const verification = await hederaService.verifyConsent(req.params.transactionId);
    res.json(verification);
  } catch (error) {
    console.error('Error verifying consent:', error);
    res.status(500).json({ error: 'Failed to verify consent' });
  }
});

// DELETE /api/consent/:id - Soft delete consent
router.delete('/:id', async (req, res) => {
  try {
    const consent = await Consent.findOne({ 
      consentId: req.params.id, 
      isActive: true 
    });

    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    // Soft delete
    consent.isActive = false;
    await consent.save();

    res.json({ message: 'Consent deleted successfully' });
  } catch (error) {
    console.error('Error deleting consent:', error);
    res.status(500).json({ error: 'Failed to delete consent' });
  }
});

module.exports = router;