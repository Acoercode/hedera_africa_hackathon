const express = require('express');
const router = express.Router();
const Consent = require('../models/Consent');
const hederaService = require('../services/hederaService');
const incentiveService = require('../services/incentiveService');
const { v4: uuidv4 } = require('uuid');
const { TokenId, TokenMintTransaction, TransferTransaction, AccountId: HederaAccountId, TopicMessageSubmitTransaction } = require('@hashgraph/sdk');

// GET /api/consent - Get all consents
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId, status, type, includeRevoked = false } = req.query;
    const query = {};
    
    // By default, only show active consents unless includeRevoked is true
    if (includeRevoked !== 'true') {
      query.isActive = true;
    }
    
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

// POST /api/consent/mint-and-transfer - Mint consent NFT and transfer to user
router.post('/mint-and-transfer', async (req, res) => {
  try {
    const {
      accountId,
      consentId,
      consentType,
      dataTypes,
      purposes,
      validFrom,
      validUntil
    } = req.body;

    if (!accountId || !consentId || !consentType || !dataTypes || !purposes || !validFrom || !validUntil) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: accountId, consentId, consentType, dataTypes, purposes, validFrom, validUntil' 
      });
    }

    // Use the Consent NFT Token ID
    const tokenId = TokenId.fromString('0.0.6886067');

    // Create consent hash for off-chain storage
    const consentPayload = {
      consentId,
      consentType,
      dataTypes,
      purposes,
      validFrom,
      validUntil,
      subject: accountId,
      version: "1.0"
    };
    const payloadStr = JSON.stringify(consentPayload);
    const consentHashHex = require('crypto').createHash('sha256').update(payloadStr).digest('hex');

    // Ultra-compact metadata: just 8 bytes (timestamp)
    const timestamp = Math.floor(Date.now() / 1000);
    const metadataBytes = Buffer.alloc(8);
    metadataBytes.writeBigUInt64BE(BigInt(timestamp), 0);

    // 1) Mint to treasury
    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([metadataBytes])
      .freezeWith(hederaService.client)
      .signWithOperator(hederaService.client);
    
    const mintRx = await mintTx.execute(hederaService.client);
    const mintRec = await mintRx.getReceipt(hederaService.client);
    const serial = mintRec.serials[0].toNumber();

    console.log(`✅ Minted consent NFT: Serial #${serial} for consent ${consentId}`);

    // 2) Transfer minted serial from treasury to user
    const xferTx = await new TransferTransaction()
      .addNftTransfer(tokenId, serial, hederaService.operatorId, HederaAccountId.fromString(accountId))
      .freezeWith(hederaService.client)
      .signWithOperator(hederaService.client);
    
    const xferRx = await xferTx.execute(hederaService.client);
    const xferRec = await xferRx.getReceipt(hederaService.client);

    console.log(`✅ Transferred consent NFT to user: ${accountId}`);

    // 3) Persist consent record in database
    const consent = new Consent({
      consentId,
      patientId: accountId,
      consentType: 'genomic_analysis',
      dataTypes: ['whole_genome', 'exome'],
      purposes: ['research', 'clinical_care'],
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      consentText: `I consent to ${consentType} for the purposes of ${purposes.join(', ')}`,
      consentVersion: "1.0",
      language: "en",
      patientSignature: "nft_minted",
      signatureTimestamp: new Date(),
      signatureMethod: "wallet_signature",
      hederaAccountId: accountId,
      consentHash: consentHashHex,
      consentTransactionId: xferRx.transactionId.toString(),
      topicId: hederaService.consentTopicId || '0.0.123456',
      consentStatus: 'granted',
      consentNFTTokenId: tokenId.toString(),
      consentNFTSerialNumber: serial.toString(),
      consentNFTTransactionId: xferRx.transactionId.toString(),
      nftMintedAt: new Date()
    });

    await consent.save();
    console.log(`✅ Consent saved to database with NFT Serial #${serial}`);

    // Submit anonymized consent hash to HCS
    try {
      const hederaResult = await hederaService.submitConsentHash({
        consentId,
        consentType,
        dataTypes,
        purposes,
        validFrom: consent.validFrom,
        validUntil: consent.validUntil
      });

      console.log('✅ Consent hash submitted to HCS:', hederaResult.transactionId);
    } catch (hederaError) {
      console.error('HCS submission failed:', hederaError);
      // Continue anyway - the NFT is already minted and transferred
    }

    res.json({
      success: true,
      tokenIdStr: tokenId.toString(),
      serial,
      mirrorTxId: xferRx.transactionId.toString(),
      consentHash: consentHashHex,
      nftMetadata: {
        timestamp: timestamp,
        size: 8
      },
      consentPayload,
      consent: {
        consentId: consent.consentId,
        consentType: consent.consentType,
        consentStatus: consent.consentStatus,
        consentHash: consentHashHex,
        consentTransactionId: consent.consentTransactionId,
        consentNFTTokenId: consent.consentNFTTokenId,
        consentNFTSerialNumber: consent.consentNFTSerialNumber,
        consentNFTTransactionId: consent.consentNFTTransactionId,
        validFrom: consent.validFrom,
        validUntil: consent.validUntil
      },
      message: 'Consent NFT minted and transferred successfully'
    });

  } catch (error) {
    console.error('Error minting consent NFT:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mint consent NFT',
      error: error.message 
    });
  }
});

// POST /api/consent/:id/revoke - Revoke a consent
router.post('/:id/revoke', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, revokedBy } = req.body;

    if (!reason || !revokedBy) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: reason, revokedBy' 
      });
    }

    // Find the consent
    const consent = await Consent.findOne({ consentId: id, isActive: true });
    if (!consent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Consent not found' 
      });
    }

    // Check if consent is already revoked
    if (consent.consentStatus === 'revoked') {
      return res.status(400).json({ 
        success: false, 
        message: 'Consent is already revoked' 
      });
    }

    // Update consent status in database
    consent.consentStatus = 'revoked';
    consent.revocationReason = reason;
    consent.revokedAt = new Date();
    consent.revokedBy = revokedBy;
    consent.isActive = false;
    consent.updatedAt = new Date();

    await consent.save();
    console.log(`✅ Consent ${id} revoked in database`);

    // Update NFT status on Hedera (if NFT exists)
    let revocationTransactionId = null;
    if (consent.consentNFTTokenId && consent.consentNFTSerialNumber) {
      try {
        // Create revocation message for the NFT
        const revocationMessage = JSON.stringify({
          type: 'consent_revocation',
          consentId: consent.consentId,
          tokenId: consent.consentNFTTokenId,
          serialNumber: consent.consentNFTSerialNumber,
          reason: reason,
          revokedBy: revokedBy,
          timestamp: new Date().toISOString(),
          status: 'revoked'
        });

        // Submit revocation to HCS for audit trail
        const topicMessageTransaction = new TopicMessageSubmitTransaction()
          .setTopicId(hederaService.consentTopicId)
          .setMessage(revocationMessage);

        const response = await topicMessageTransaction.execute(hederaService.client);
        const receipt = await response.getReceipt(hederaService.client);
        
        revocationTransactionId = response.transactionId.toString();
        console.log(`✅ Consent revocation submitted to HCS: ${receipt.topicSequenceNumber}`);
        
        // Update consent with revocation transaction ID
        consent.revocationTransactionId = revocationTransactionId;
        await consent.save();
        
      } catch (hederaError) {
        console.error('HCS revocation submission failed:', hederaError);
        // Continue anyway - the consent is already revoked in the database
      }
    }

    res.json({
      success: true,
      consent: {
        consentId: consent.consentId,
        consentStatus: consent.consentStatus,
        revocationReason: consent.revocationReason,
        revokedAt: consent.revokedAt,
        revokedBy: consent.revokedBy,
        revocationTransactionId: revocationTransactionId,
        isActive: consent.isActive,
        updatedAt: consent.updatedAt
      },
      message: 'Consent revoked successfully and NFT status updated on Hedera'
    });

  } catch (error) {
    console.error('Error revoking consent:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to revoke consent',
      error: error.message 
    });
  }
});

// POST /api/consent/genomic-passport - Mint genomic passport NFT for user
router.post('/genomic-passport', async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: accountId' 
      });
    }

    // Check if user already has a genomic passport
    const existingPassport = await Consent.findOne({ 
      patientId: accountId, 
      consentType: 'genomic_passport',
      isActive: true 
    });

    if (existingPassport) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already has a genomic passport NFT',
        existingPassport: {
          consentId: existingPassport.consentId,
          tokenId: existingPassport.consentNFTTokenId,
          serialNumber: existingPassport.consentNFTSerialNumber,
          mintedAt: existingPassport.nftMintedAt
        }
      });
    }

    // Use the dedicated Ziva Passport NFT Token ID
    const tokenId = TokenId.fromString('0.0.6886170');

    // Create genomic passport hash
    const passportPayload = {
      type: 'genomic_passport',
      accountId: accountId,
      purpose: 'genomic_data_ownership_proof',
      version: "1.0",
      timestamp: new Date().toISOString()
    };
    const payloadStr = JSON.stringify(passportPayload);
    const passportHashHex = require('crypto').createHash('sha256').update(payloadStr).digest('hex');

    // Ultra-compact metadata: 8 bytes (timestamp)
    const timestamp = Math.floor(Date.now() / 1000);
    const metadataBytes = Buffer.alloc(8);
    metadataBytes.writeBigUInt64BE(BigInt(timestamp), 0);

    // 1) Mint to treasury
    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([metadataBytes])
      .freezeWith(hederaService.client)
      .signWithOperator(hederaService.client);
    
    const mintRx = await mintTx.execute(hederaService.client);
    const mintRec = await mintRx.getReceipt(hederaService.client);
    const serial = mintRec.serials[0].toNumber();

    console.log(`✅ Minted Ziva Passport NFT: Serial #${serial} for account ${accountId}`);

    // 2) Transfer minted serial from treasury to user
    const xferTx = await new TransferTransaction()
      .addNftTransfer(tokenId, serial, hederaService.operatorId, HederaAccountId.fromString(accountId))
      .freezeWith(hederaService.client)
      .signWithOperator(hederaService.client);
    
    const xferRx = await xferTx.execute(hederaService.client);
    const xferRec = await xferRx.getReceipt(hederaService.client);

    console.log(`✅ Transferred Ziva Passport NFT to user: ${accountId}`);

    // 3) Persist genomic passport record in database
    const passportConsent = new Consent({
      consentId: `genomic-passport-${accountId}-${Date.now()}`,
      patientId: accountId,
      consentType: 'genomic_passport',
      dataTypes: ['genomic_passport'],
      purposes: ['data_ownership_proof'],
      validFrom: new Date(),
      validUntil: null, // Genomic passport doesn't expire
      consentText: `Ziva Passport NFT proving ownership of genomic data for account ${accountId}`,
      consentVersion: "1.0",
      language: "en",
      patientSignature: "nft_minted",
      signatureTimestamp: new Date(),
      signatureMethod: "wallet_signature",
      hederaAccountId: accountId,
      consentHash: passportHashHex,
      consentTransactionId: xferRx.transactionId.toString(),
      topicId: hederaService.genomicTopicId || '0.0.6882233',
      consentStatus: 'granted',
      consentNFTTokenId: tokenId.toString(),
      consentNFTSerialNumber: serial.toString(),
      consentNFTTransactionId: xferRx.transactionId.toString(),
      nftMintedAt: new Date()
    });

    await passportConsent.save();
    console.log(`✅ Ziva Passport saved to database with NFT Serial #${serial}`);

    // Submit genomic passport hash to HCS
    try {
      const passportMessage = JSON.stringify({
        type: 'ziva_passport_minted',
        accountId: accountId,
        tokenId: tokenId.toString(),
        serialNumber: serial,
        passportHash: passportHashHex,
        timestamp: new Date().toISOString()
      });

      const topicMessageTransaction = new TopicMessageSubmitTransaction()
        .setTopicId(hederaService.genomicTopicId)
        .setMessage(passportMessage);

      const response = await topicMessageTransaction.execute(hederaService.client);
      const receipt = await response.getReceipt(hederaService.client);
      
      console.log(`✅ Ziva Passport submitted to HCS: ${receipt.topicSequenceNumber}`);
    } catch (hederaError) {
      console.error('HCS submission failed:', hederaError);
      // Continue anyway - the NFT is already minted and transferred
    }

    res.json({
      success: true,
      tokenIdStr: tokenId.toString(),
      serial,
      mirrorTxId: xferRx.transactionId.toString(),
      passportHash: passportHashHex,
      nftMetadata: {
        timestamp: timestamp,
        size: 8
      },
      passportPayload,
      passport: {
        consentId: passportConsent.consentId,
        consentType: passportConsent.consentType,
        consentStatus: passportConsent.consentStatus,
        consentHash: passportConsent.consentHash,
        consentTransactionId: passportConsent.consentTransactionId,
        consentNFTTokenId: passportConsent.consentNFTTokenId,
        consentNFTSerialNumber: passportConsent.consentNFTSerialNumber,
        consentNFTTransactionId: passportConsent.consentNFTTransactionId,
        validFrom: passportConsent.validFrom,
        validUntil: passportConsent.validUntil
      },
      message: 'Ziva Passport NFT minted and transferred successfully'
    });

  } catch (error) {
    console.error('Error minting Ziva Passport NFT:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mint Ziva Passport NFT',
      error: error.message 
    });
  }
});

module.exports = router;
