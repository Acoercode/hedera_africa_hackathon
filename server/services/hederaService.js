const { Client, TopicCreateTransaction, TopicMessageSubmitTransaction, AccountId, PrivateKey, Hbar, TokenCreateTransaction, TokenType, TokenSupplyType, TokenMintTransaction, TransferTransaction, TokenNftInfoQuery, NftId } = require('@hashgraph/sdk');
const crypto = require('crypto');

class HederaService {
  constructor() {
    this.client = null;
    this.operatorId = null;
    this.operatorKey = null;
    this.consentTopicId = null;
    this.genomicTopicId = null;
    this.incentiveTokenId = null;
    this.consentNFTTokenId = null;
    this.genomicDataNFTTokenId = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Initialize Hedera client
      this.operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID || '0.0.123456');
      this.operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY || '302e020100300506032b657004220420...');
      
      // Create client for testnet
      this.client = Client.forTestnet();
      this.client.setOperator(this.operatorId, this.operatorKey);
      
      console.log('🔗 Hedera client initialized');
      console.log(`👤 Operator ID: ${this.operatorId.toString()}`);
      
      // Create or get consent topic
      await this.initializeConsentTopic();
      
      // Create or get genomic data topic
      await this.initializeGenomicTopic();
      
      this.initialized = true;
      console.log('✅ Hedera service initialized successfully');
      
    } catch (error) {
      console.error('❌ Hedera service initialization failed:', error);
      throw error;
    }
  }

  async initializeConsentTopic() {
    try {
      // Check if consent topic already exists
      if (process.env.HEDERA_CONSENT_TOPIC_ID) {
        this.consentTopicId = process.env.HEDERA_CONSENT_TOPIC_ID;
        console.log(`📋 Using existing consent topic: ${this.consentTopicId}`);
        return;
      }

      // Create new consent topic
      const topicCreateTransaction = new TopicCreateTransaction()
        .setTopicMemo('Genomic Data Mesh - Consent Management')
        .setSubmitKey(this.operatorKey);

      const topicCreateResponse = await topicCreateTransaction.execute(this.client);
      const topicCreateReceipt = await topicCreateResponse.getReceipt(this.client);
      
      this.consentTopicId = topicCreateReceipt.topicId.toString();
      console.log(`📋 Created consent topic: ${this.consentTopicId}`);
      
      // Save topic ID to environment for future use
      console.log(`💡 Add this to your .env file: HEDERA_CONSENT_TOPIC_ID=${this.consentTopicId}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize consent topic:', error);
      throw error;
    }
  }

  async initializeGenomicTopic() {
    try {
      // Check if genomic topic already exists
      if (process.env.HEDERA_GENOMIC_TOPIC_ID) {
        this.genomicTopicId = process.env.HEDERA_GENOMIC_TOPIC_ID;
        console.log(`🧬 Using existing genomic topic: ${this.genomicTopicId}`);
        return;
      }

      // Create new genomic data topic
      const topicCreateTransaction = new TopicCreateTransaction()
        .setTopicMemo('Genomic Data Mesh - Data Access Logs')
        .setSubmitKey(this.operatorKey);

      const topicCreateResponse = await topicCreateTransaction.execute(this.client);
      const topicCreateReceipt = await topicCreateResponse.getReceipt(this.client);
      
      this.genomicTopicId = topicCreateReceipt.topicId.toString();
      console.log(`🧬 Created genomic topic: ${this.genomicTopicId}`);
      
      // Save topic ID to environment for future use
      console.log(`💡 Add this to your .env file: HEDERA_GENOMIC_TOPIC_ID=${this.genomicTopicId}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize genomic topic:', error);
      throw error;
    }
  }

  // Create consent hash and submit to Hedera
  async submitConsentHash(consentData) {
    if (!this.initialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      // Create consent hash
      const consentString = JSON.stringify({
        patientId: consentData.patientId,
        consentType: consentData.consentType,
        dataTypes: consentData.dataTypes,
        purposes: consentData.purposes,
        validFrom: consentData.validFrom,
        validUntil: consentData.validUntil,
        timestamp: new Date().toISOString()
      });

      const consentHash = crypto.createHash('sha256').update(consentString).digest('hex');
      
      // Create HCS message
      const message = JSON.stringify({
        type: 'consent_hash',
        patientId: consentData.patientId,
        consentId: consentData.consentId,
        hash: consentHash,
        timestamp: new Date().toISOString(),
        signature: consentData.patientSignature
      });

      // Submit to Hedera Consensus Service
      const topicMessageTransaction = new TopicMessageSubmitTransaction()
        .setTopicId(this.consentTopicId)
        .setMessage(message);

      const response = await topicMessageTransaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      console.log(`✅ Consent hash submitted to Hedera: ${receipt.topicSequenceNumber}`);
      
      return {
        transactionId: response.transactionId.toString(),
        topicSequenceNumber: receipt.topicSequenceNumber.toString(),
        consentHash,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Failed to submit consent hash:', error);
      throw error;
    }
  }

  // Submit genomic data access log to Hedera
  async submitDataAccessLog(accessData) {
    if (!this.initialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      // Create access log message
      const message = JSON.stringify({
        type: 'data_access_log',
        patientId: accessData.patientId,
        dataId: accessData.dataId,
        entityId: accessData.entityId,
        action: accessData.action,
        purpose: accessData.purpose,
        timestamp: new Date().toISOString(),
        consentTransactionId: accessData.consentTransactionId
      });

      // Submit to Hedera Consensus Service
      const topicMessageTransaction = new TopicMessageSubmitTransaction()
        .setTopicId(this.genomicTopicId)
        .setMessage(message);

      const response = await topicMessageTransaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      console.log(`✅ Data access log submitted to Hedera: ${receipt.topicSequenceNumber}`);
      
      return {
        transactionId: response.transactionId.toString(),
        topicSequenceNumber: receipt.topicSequenceNumber.toString(),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Failed to submit data access log:', error);
      throw error;
    }
  }

  // Verify consent on blockchain
  async verifyConsent(consentTransactionId) {
    if (!this.initialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      // This would typically involve querying the HCS topic for the specific message
      // For now, we'll return a mock verification
      console.log(`🔍 Verifying consent transaction: ${consentTransactionId}`);
      
      return {
        isValid: true,
        transactionId: consentTransactionId,
        verifiedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Failed to verify consent:', error);
      throw error;
    }
  }

  // Get topic information
  getTopicInfo() {
    return {
      consentTopicId: this.consentTopicId,
      genomicTopicId: this.genomicTopicId,
      initialized: this.initialized
    };
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.initialized) {
        return { status: 'not_initialized', error: 'Hedera service not initialized' };
      }

      // Simple health check - try to get account info
      const accountInfo = await this.client.getAccountInfo(this.operatorId);
      
      return {
        status: 'healthy',
        operatorId: this.operatorId.toString(),
        balance: accountInfo.balance.toString(),
        topics: {
          consent: this.consentTopicId,
          genomic: this.genomicTopicId
        },
        tokens: {
          incentive: this.incentiveTokenId,
          consentNFT: this.consentNFTTokenId,
          genomicDataNFT: this.genomicDataNFTTokenId
        }
      };
      
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  // ===== NFT AND TOKEN MANAGEMENT =====

  // Create consent NFT
  async createConsentNFT(consentData) {
    if (!this.initialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      const tokenCreateTransaction = new TokenCreateTransaction()
        .setTokenName(`Consent-${consentData.consentId}`)
        .setTokenSymbol(`CONSENT-${consentData.patientId}`)
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(this.operatorId)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(1)
        .setTokenMemo(JSON.stringify({
          patientId: consentData.patientId,
          consentType: consentData.consentType,
          dataTypes: consentData.dataTypes,
          purposes: consentData.purposes,
          validFrom: consentData.validFrom,
          validUntil: consentData.validUntil
        }));

      const response = await tokenCreateTransaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      console.log(`✅ Created consent NFT: ${receipt.tokenId.toString()}`);
      
      return {
        tokenId: receipt.tokenId.toString(),
        transactionId: response.transactionId.toString()
      };
    } catch (error) {
      console.error('❌ Failed to create consent NFT:', error);
      throw error;
    }
  }

  // Mint consent NFT to patient
  async mintConsentNFT(tokenId, patientAccountId, consentHash) {
    if (!this.initialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      const tokenMintTransaction = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([Buffer.from(consentHash, 'hex')]);

      const response = await tokenMintTransaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      console.log(`✅ Minted consent NFT: ${receipt.serials[0].toString()}`);
      
      return {
        serialNumber: receipt.serials[0].toString(),
        transactionId: response.transactionId.toString()
      };
    } catch (error) {
      console.error('❌ Failed to mint consent NFT:', error);
      throw error;
    }
  }

  // Create genomic data NFT
  async createGenomicDataNFT(genomicData) {
    if (!this.initialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      const tokenCreateTransaction = new TokenCreateTransaction()
        .setTokenName(`Genome-${genomicData.dataId}`)
        .setTokenSymbol(`GENOME-${genomicData.patientId}`)
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(this.operatorId)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(1)
        .setTokenMemo(JSON.stringify({
          patientId: genomicData.patientId,
          dataType: genomicData.dataType,
          fileHash: genomicData.fileHash,
          encryptionKey: genomicData.encryptionKey,
          accessLevel: genomicData.accessLevel
        }));

      const response = await tokenCreateTransaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      console.log(`✅ Created genomic data NFT: ${receipt.tokenId.toString()}`);
      
      return {
        tokenId: receipt.tokenId.toString(),
        transactionId: response.transactionId.toString()
      };
    } catch (error) {
      console.error('❌ Failed to create genomic data NFT:', error);
      throw error;
    }
  }

  // Mint genomic data NFT to patient
  async mintGenomicDataNFT(tokenId, patientAccountId, encryptedData) {
    if (!this.initialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      const tokenMintTransaction = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([Buffer.from(encryptedData, 'hex')]);

      const response = await tokenMintTransaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      console.log(`✅ Minted genomic data NFT: ${receipt.serials[0].toString()}`);
      
      return {
        serialNumber: receipt.serials[0].toString(),
        transactionId: response.transactionId.toString()
      };
    } catch (error) {
      console.error('❌ Failed to mint genomic data NFT:', error);
      throw error;
    }
  }

  // Create incentive token
  async createIncentiveToken() {
    if (!this.initialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      const tokenCreateTransaction = new TokenCreateTransaction()
        .setTokenName("Genomic Data Incentive Token")
        .setTokenSymbol("GDI")
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(2)
        .setInitialSupply(1000000)
        .setTreasuryAccountId(this.operatorId)
        .setSupplyType(TokenSupplyType.Infinite)
        .setTokenMemo("Incentive tokens for genomic data sharing");

      const response = await tokenCreateTransaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      this.incentiveTokenId = receipt.tokenId.toString();
      console.log(`✅ Created incentive token: ${this.incentiveTokenId}`);
      
      return {
        tokenId: this.incentiveTokenId,
        transactionId: response.transactionId.toString()
      };
    } catch (error) {
      console.error('❌ Failed to create incentive token:', error);
      throw error;
    }
  }

  // Distribute incentive tokens
  async distributeIncentiveTokens(recipientAccountId, amount, reason) {
    if (!this.initialized) {
      throw new Error('Hedera service not initialized');
    }

    if (!this.incentiveTokenId) {
      throw new Error('Incentive token not created');
    }

    try {
      const tokenTransferTransaction = new TransferTransaction()
        .addTokenTransfer(this.incentiveTokenId, this.operatorId, -amount)
        .addTokenTransfer(this.incentiveTokenId, recipientAccountId, amount)
        .setTransactionMemo(`Incentive: ${reason}`);

      const response = await tokenTransferTransaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      console.log(`✅ Distributed ${amount} GDI tokens to ${recipientAccountId}: ${reason}`);
      
      return {
        transactionId: response.transactionId.toString(),
        amount,
        reason
      };
    } catch (error) {
      console.error('❌ Failed to distribute incentive tokens:', error);
      throw error;
    }
  }

  // Get NFT information
  async getNFTInfo(tokenId, serialNumber) {
    if (!this.initialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      const nftInfo = await new TokenNftInfoQuery()
        .setTokenId(tokenId)
        .setNftId(new NftId(tokenId, serialNumber))
        .execute(this.client);
      
      return {
        tokenId: nftInfo.tokenId.toString(),
        serialNumber: nftInfo.nftId.serialNumber.toString(),
        ownerId: nftInfo.accountId.toString(),
        metadata: nftInfo.metadata.toString(),
        creationTime: nftInfo.creationTime
      };
    } catch (error) {
      console.error('❌ Failed to get NFT info:', error);
      throw error;
    }
  }

  // Verify consent NFT
  async verifyConsentNFT(tokenId, serialNumber, patientId) {
    if (!this.initialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      const nftInfo = await this.getNFTInfo(tokenId, serialNumber);
      
      // Verify ownership
      if (nftInfo.ownerId !== patientId) {
        return { valid: false, reason: 'NFT not owned by patient' };
      }
      
      // Verify metadata
      const metadata = JSON.parse(nftInfo.metadata);
      if (metadata.patientId !== patientId) {
        return { valid: false, reason: 'NFT metadata mismatch' };
      }
      
      // Verify expiration
      if (new Date(metadata.validUntil) < new Date()) {
        return { valid: false, reason: 'Consent NFT expired' };
      }
      
      return { valid: true, metadata };
    } catch (error) {
      console.error('❌ Failed to verify consent NFT:', error);
      return { valid: false, reason: 'Verification failed' };
    }
  }
}

// Export singleton instance
const hederaService = new HederaService();
module.exports = hederaService;