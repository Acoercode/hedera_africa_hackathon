const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Consent = require('../models/Consent');
const Activity = require('../models/Activity');
const hederaService = require('../services/hederaService');
const incentiveService = require('../services/incentiveService');
const { v4: uuidv4 } = require('uuid');
const { TokenId, TokenMintTransaction, TransferTransaction, AccountId: HederaAccountId, TopicMessageSubmitTransaction, TokenNftInfoQuery, NftId } = require('@hashgraph/sdk');

// Helper function to log incentive activities
const logIncentiveActivity = async (accountId, incentiveResult, consentId) => {
  try {
    if (!incentiveResult) return;

    const activityId = uuidv4();
    const activity = new Activity({
      activityId,
      userId: accountId,
      activityName: `incentive_${incentiveResult.success ? 'awarded' : 'failed'}`,
      activityDescription: incentiveResult.success 
        ? `Earned ${incentiveResult.amount} RDZ tokens for ${incentiveResult.action}`
        : `Incentive not awarded: ${incentiveResult.message || 'Unknown error'}`,
      activityType: 'incentive',
      metadata: {
        incentiveResult: {
          success: incentiveResult.success,
          amount: incentiveResult.amount,
          action: incentiveResult.action,
          transactionId: incentiveResult.transactionId,
          tokenId: incentiveResult.tokenId,
          error: incentiveResult.error,
          requiresAssociation: incentiveResult.requiresAssociation
        },
        consentId: consentId
      },
      transactionId: incentiveResult.transactionId || `incentive_${activityId}`
    });

    await activity.save();
  } catch (error) {
    console.error('❌ Failed to log incentive activity:', error);
  }
};

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
    const tokenId = TokenId.fromString(process.env.HEDERA_RESEARCH_CONSENT_NFT_ID || '0.0.6886067');

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


    // 2) Transfer minted serial from treasury to user
    const xferTx = await new TransferTransaction()
      .addNftTransfer(tokenId, serial, hederaService.operatorId, HederaAccountId.fromString(accountId))
      .freezeWith(hederaService.client)
      .signWithOperator(hederaService.client);
    
    const xferRx = await xferTx.execute(hederaService.client);
    const xferRec = await xferRx.getReceipt(hederaService.client);


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

    } catch (hederaError) {
      console.error('HCS submission failed:', hederaError);
      // Continue anyway - the NFT is already minted and transferred
    }

    // Mint incentive tokens for research consent
    let incentiveResult = null;
    try {
      incentiveResult = await hederaService.incentiveService.mintAndTransferIncentive(
        consent.hederaAccountId,
        'research_consent',
        consent.consentId
      );
      if (incentiveResult && incentiveResult.success) {
        console.log(`🎁 Research consent incentive tokens awarded: ${incentiveResult.amount} tokens`);
      } else if (incentiveResult && !incentiveResult.success) {
      }
    } catch (incentiveError) {
      console.error('❌ Failed to award research consent incentive tokens:', incentiveError);
      // Don't fail the main request if incentive fails
    }

    // Log incentive activity
    await logIncentiveActivity(accountId, incentiveResult, consent.consentId);

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
      incentive: incentiveResult ? {
        success: incentiveResult.success,
        amount: incentiveResult.amount,
        action: incentiveResult.action,
        transactionId: incentiveResult.transactionId,
        tokenId: incentiveResult.tokenId,
        error: incentiveResult.error,
        message: incentiveResult.message,
        requiresAssociation: incentiveResult.requiresAssociation
      } : null,
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

    // Use the dedicated RDZ Passport NFT Token ID
    const tokenId = TokenId.fromString(process.env.HEDERA_PASSPORT_NFT_ID || '0.0.6886170');

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


    // 2) Transfer minted serial from treasury to user
    const xferTx = await new TransferTransaction()
      .addNftTransfer(tokenId, serial, hederaService.operatorId, HederaAccountId.fromString(accountId))
      .freezeWith(hederaService.client)
      .signWithOperator(hederaService.client);
    
    const xferRx = await xferTx.execute(hederaService.client);
    const xferRec = await xferRx.getReceipt(hederaService.client);


    // 3) Persist genomic passport record in database
    const passportConsent = new Consent({
      consentId: `genomic-passport-${accountId}-${Date.now()}`,
      patientId: accountId,
      consentType: 'genomic_passport',
      dataTypes: ['genomic_passport'],
      purposes: ['data_ownership_proof'],
      validFrom: new Date(),
      validUntil: null, // Genomic passport doesn't expire
      consentText: `RDZ Passport NFT proving ownership of genomic data for account ${accountId}`,
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

    // Submit genomic passport hash to HCS
    try {
      const passportMessage = JSON.stringify({
        type: 'rdz_passport_minted',
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
      message: 'RDZ Passport NFT minted and transferred successfully'
    });

    // Mint incentive tokens for passport creation
    let incentiveResult = null;
    try {
      incentiveResult = await hederaService.incentiveService.mintAndTransferIncentive(
        accountId,
        'passport_creation',
        passportConsent.consentId
      );
      if (incentiveResult && incentiveResult.success) {
        console.log(`🎁 Passport creation incentive tokens awarded: ${incentiveResult.amount} tokens`);
      } else if (incentiveResult && !incentiveResult.success) {
      }
    } catch (incentiveError) {
      console.error('❌ Failed to award passport creation incentive tokens:', incentiveError);
      // Don't fail the main request if incentive fails
    }

    // Log incentive activity
    await logIncentiveActivity(accountId, incentiveResult, passportConsent.consentId);

    // Add incentive info to response
    if (incentiveResult) {
      res.locals.incentive = {
        amount: incentiveResult.amount,
        action: incentiveResult.action,
        transactionId: incentiveResult.transactionId,
        tokenId: incentiveResult.tokenId
      };
    }

  } catch (error) {
    console.error('Error minting RDZ Passport NFT:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mint RDZ Passport NFT',
      error: error.message 
    });
  }
});

// POST /api/consent/data-sync - Mint data sync consent NFT for user
router.post('/data-sync', async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: accountId'
      });
    }

    // Check if user already has a data sync consent NFT
    const existingActiveDataSyncConsent = await Consent.findOne({
      hederaAccountId: accountId,
      consentType: 'data_sync',
      isActive: true
    });

    if (existingActiveDataSyncConsent) {
      return res.status(200).json({
        success: true,
        message: 'User already has an active data sync consent NFT',
        existingConsent: {
          tokenId: existingActiveDataSyncConsent.consentNFTTokenId,
          serialNumber: existingActiveDataSyncConsent.consentNFTSerialNumber,
          mintedAt: existingActiveDataSyncConsent.nftMintedAt
        }
      });
    }

    // Allow creating new consent even if there are revoked ones

    // Use the dedicated Data Sync NFT Token ID
    const tokenId = TokenId.fromString(process.env.HEDERA_DATA_SYNC_NFT_ID || '0.0.123456');

    // Create data sync consent hash
    const dataSyncPayload = {
      type: 'data_sync_consent',
      accountId: accountId,
      timestamp: new Date().toISOString(),
      purpose: 'genomic_data_synchronization'
    };

    const dataSyncHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(dataSyncPayload))
      .digest('hex');

    // Create consent record first
    const dataSyncConsent = new Consent({
      consentId: `DATA_SYNC_${accountId}_${Date.now()}`,
      patientId: accountId, // Use accountId as patientId for data sync
      hederaAccountId: accountId,
      consentType: 'data_sync',
      consentStatus: 'granted',
      dataTypes: ['whole_genome', 'exome', 'targeted_panel'], // Use valid enum values
      purposes: ['data_synchronization'],
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      consentText: `Data Sync Consent for genomic data synchronization for account ${accountId}`,
      consentVersion: '1.0',
      language: 'en',
      consentHash: dataSyncHash,
      signatureMethod: 'wallet_signature', // Use valid enum value
      signatureTimestamp: new Date(),
      patientSignature: 'nft_minted',
      isActive: true,
      topicId: hederaService.genomicTopicId || '0.0.6882233',
      nftMintedAt: new Date()
    });

    // Mint the data sync consent NFT
    const mintTx = new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([Buffer.from(dataSyncHash.substring(0, 8))]) // 8-byte timestamp
      .freezeWith(hederaService.client);

    const mintTxResponse = await mintTx.execute(hederaService.client);
    const mintReceipt = await mintTxResponse.getReceipt(hederaService.client);
    
    console.log('Mint receipt:', mintReceipt);
    console.log('Serials:', mintReceipt.serials);
    
    if (!mintReceipt.serials || mintReceipt.serials.length === 0) {
      throw new Error('No serials returned from mint transaction');
    }
    
    const serial = mintReceipt.serials[0].toString();


    // Transfer NFT to user
    const transferTx = new TransferTransaction()
      .addNftTransfer(tokenId, serial, hederaService.operatorId, HederaAccountId.fromString(accountId))
      .freezeWith(hederaService.client);

    const transferTxResponse = await transferTx.execute(hederaService.client);
    const xferRx = await transferTxResponse.getReceipt(hederaService.client);


    // Update consent record with NFT details
    dataSyncConsent.consentNFTTokenId = tokenId.toString();
    dataSyncConsent.consentNFTSerialNumber = serial.toString();
    dataSyncConsent.consentNFTTransactionId = xferRx.transactionId ? xferRx.transactionId.toString() : transferTxResponse.transactionId.toString();
    dataSyncConsent.consentTransactionId = transferTxResponse.transactionId.toString();

    await dataSyncConsent.save();


    // Submit to HCS for audit trail
    const hcsMessage = `DATA_SYNC_CONSENT:${accountId}:${dataSyncHash}:${serial}:${new Date().toISOString()}`;
    const hcsTx = new TopicMessageSubmitTransaction()
      .setTopicId(hederaService.genomicTopicId)
      .setMessage(hcsMessage)
      .freezeWith(hederaService.client);

    await hcsTx.execute(hederaService.client);

    // Mint incentive tokens for data sync consent
    let incentiveResult = null;
    try {
      incentiveResult = await hederaService.incentiveService.mintAndTransferIncentive(
        accountId,
        'data_sync',
        dataSyncConsent.consentId
      );
      if (incentiveResult && incentiveResult.success) {
        console.log(`🎁 Data sync incentive tokens awarded: ${incentiveResult.amount} tokens`);
      } else if (incentiveResult && !incentiveResult.success) {
      }
    } catch (incentiveError) {
      console.error('❌ Failed to award data sync incentive tokens:', incentiveError);
      // Don't fail the main request if incentive fails
    }

    // Log incentive activity
    await logIncentiveActivity(accountId, incentiveResult, dataSyncConsent.consentId);

    res.status(200).json({
      success: true,
      data: {
        consentId: dataSyncConsent.consentId,
        consentNFTTokenId: dataSyncConsent.consentNFTTokenId,
        consentNFTSerialNumber: dataSyncConsent.consentNFTSerialNumber,
        consentNFTTransactionId: dataSyncConsent.consentNFTTransactionId,
        consentHash: dataSyncConsent.consentHash,
        mintedAt: dataSyncConsent.nftMintedAt,
        incentive: incentiveResult ? {
          success: incentiveResult.success,
          amount: incentiveResult.amount,
          action: incentiveResult.action,
          transactionId: incentiveResult.transactionId,
          tokenId: incentiveResult.tokenId,
          error: incentiveResult.error,
          message: incentiveResult.message,
          requiresAssociation: incentiveResult.requiresAssociation
        } : null
      },
      message: 'Data Sync Consent NFT minted and transferred successfully'
    });

  } catch (error) {
    console.error('Error minting Data Sync Consent NFT:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mint Data Sync Consent NFT',
      error: error.message 
    });
  }
});

// GET /api/consent/data-sync/status/:accountId - Check data sync consent status
router.get('/data-sync/status/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: accountId'
      });
    }

    // Find data sync consent for this account
    const dataSyncConsent = await Consent.findOne({
      hederaAccountId: accountId,
      consentType: 'data_sync'
    }).sort({ createdAt: -1 }); // Get the most recent one

    if (!dataSyncConsent) {
      return res.status(200).json({
        success: true,
        consent: null,
        message: 'No data sync consent found for this account'
      });
    }

    // Verify NFT exists and is valid on Hedera network
    let nftValid = false;
    let nftError = null;
    
    try {
      if (dataSyncConsent.consentNFTTokenId && dataSyncConsent.consentNFTSerialNumber) {
        const tokenId = TokenId.fromString(dataSyncConsent.consentNFTTokenId);
        const serialNumber = parseInt(dataSyncConsent.consentNFTSerialNumber);
        
        // Check if NFT exists and is owned by the account
        const nftInfo = await new TokenNftInfoQuery()
          .setTokenId(tokenId)
          .setNftId(new NftId(tokenId, serialNumber))
          .execute(hederaService.client);
        
        if (nftInfo && nftInfo.length > 0) {
          const nft = nftInfo[0];
          nftValid = nft.accountId.toString() === accountId;
        }
      }
    } catch (error) {
      console.error('❌ Error validating NFT on Hedera:', error);
      nftError = error.message;
    }

    // Determine final active status - must be active in DB AND valid on Hedera
    const finalIsActive = dataSyncConsent.isActive && nftValid;

    res.status(200).json({
      success: true,
      consent: {
        consentId: dataSyncConsent.consentId,
        consentNFTTokenId: dataSyncConsent.consentNFTTokenId,
        consentNFTSerialNumber: dataSyncConsent.consentNFTSerialNumber,
        consentNFTTransactionId: dataSyncConsent.consentNFTTransactionId,
        consentHash: dataSyncConsent.consentHash,
        isActive: finalIsActive,
        dbIsActive: dataSyncConsent.isActive,
        nftValid: nftValid,
        nftError: nftError,
        validFrom: dataSyncConsent.validFrom,
        validUntil: dataSyncConsent.validUntil,
        mintedAt: dataSyncConsent.nftMintedAt,
        revokedAt: dataSyncConsent.revokedAt,
        revocationReason: dataSyncConsent.revocationReason,
        createdAt: dataSyncConsent.createdAt,
        updatedAt: dataSyncConsent.updatedAt
      },
      message: 'Data sync consent status retrieved successfully'
    });

  } catch (error) {
    console.error('Error checking data sync consent status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check data sync consent status',
      error: error.message 
    });
  }
});

// POST /api/consent/data-sync/revoke/:accountId - Revoke data sync consent
router.post('/data-sync/revoke/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { reason } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: accountId'
      });
    }

    // Find active data sync consent for this account
    const dataSyncConsent = await Consent.findOne({
      hederaAccountId: accountId,
      consentType: 'data_sync',
      isActive: true
    });

    if (!dataSyncConsent) {
      return res.status(404).json({
        success: false,
        message: 'No active data sync consent found for this account'
      });
    }

    // Update consent record to mark as revoked
    dataSyncConsent.isActive = false;
    dataSyncConsent.revokedAt = new Date();
    dataSyncConsent.revocationReason = reason || 'User requested revocation';
    dataSyncConsent.updatedAt = new Date();

    await dataSyncConsent.save();


    // Submit revocation to HCS for audit trail
    const revocationPayload = {
      type: 'data_sync_consent_revocation',
      accountId: accountId,
      consentId: dataSyncConsent.consentId,
      tokenId: dataSyncConsent.consentNFTTokenId,
      serialNumber: dataSyncConsent.consentNFTSerialNumber,
      reason: reason || 'User requested revocation',
      timestamp: new Date().toISOString()
    };

    const revocationHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(revocationPayload))
      .digest('hex');

    const hcsMessage = `DATA_SYNC_REVOCATION:${accountId}:${revocationHash}:${new Date().toISOString()}`;
    const hcsTx = new TopicMessageSubmitTransaction()
      .setTopicId(hederaService.genomicTopicId)
      .setMessage(hcsMessage)
      .freezeWith(hederaService.client);

    await hcsTx.execute(hederaService.client);

    res.status(200).json({
      success: true,
      data: {
        consentId: dataSyncConsent.consentId,
        revokedAt: dataSyncConsent.revokedAt,
        revocationReason: dataSyncConsent.revocationReason,
        revocationHash: revocationHash
      },
      message: 'Data sync consent revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking data sync consent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke data sync consent',
      error: error.message 
    });
  }
});

module.exports = router;
