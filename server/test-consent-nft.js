const { Client, PrivateKey, AccountId, TopicMessageSubmitTransaction, TokenCreateTransaction, TokenType, TokenSupplyType, TokenMintTransaction } = require('@hashgraph/sdk');
const crypto = require('crypto');
require('dotenv').config();

async function testConsentNFT() {
  try {
    console.log('🚀 Testing Consent NFT Creation...\n');

    // Initialize Hedera client
    const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID);
    const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY);
    
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);
    
    console.log(`👤 Using operator account: ${operatorId.toString()}\n`);

    // Test data
    const consentData = {
      consentId: 'test_consent_001',
      patientId: 'test_patient_001',
      consentType: 'genomic_analysis',
      dataTypes: ['whole_genome'],
      purposes: ['research'],
      validFrom: '2024-01-01',
      validUntil: '2025-01-01'
    };

    // 1. Create consent hash
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
    console.log(`📋 Consent Hash: ${consentHash}\n`);

    // 2. Submit consent hash to HCS
    console.log('📋 Submitting consent hash to Hedera HCS...');
    const topicId = process.env.HEDERA_CONSENT_TOPIC_ID;
    
    const message = JSON.stringify({
      type: 'consent_hash',
      patientId: consentData.patientId,
      consentId: consentData.consentId,
      hash: consentHash,
      timestamp: new Date().toISOString(),
      signature: '0x1234567890abcdef1234567890abcdef12345678'
    });

    const topicMessageTransaction = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message);

    const hcsResponse = await topicMessageTransaction.execute(client);
    const hcsReceipt = await hcsResponse.getReceipt(client);
    
    console.log(`✅ Consent hash submitted to HCS!`);
    console.log(`   Transaction ID: ${hcsResponse.transactionId.toString()}`);
    console.log(`   Topic Sequence: ${hcsReceipt.topicSequenceNumber.toString()}\n`);

    // 3. Create consent NFT
    console.log('🎫 Creating consent NFT...');
    const tokenCreateTransaction = new TokenCreateTransaction()
      .setTokenName(`Consent-${consentData.consentId}`)
      .setTokenSymbol(`CONSENT-${consentData.patientId}`)
      .setTokenType(TokenType.NonFungibleUnique)
      .setDecimals(0)
      .setInitialSupply(0)
      .setTreasuryAccountId(operatorId)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1)
      .setSupplyKey(operatorKey)  // Add supply key for minting
      .setTokenMemo(`Consent-${consentData.patientId}-${consentData.consentType}`);

    const nftResponse = await tokenCreateTransaction.execute(client);
    const nftReceipt = await nftResponse.getReceipt(client);
    const tokenId = nftReceipt.tokenId.toString();
    
    console.log(`✅ Consent NFT created!`);
    console.log(`   Token ID: ${tokenId}`);
    console.log(`   Transaction ID: ${nftResponse.transactionId.toString()}\n`);

    // 4. Mint consent NFT to patient
    console.log('🎫 Minting consent NFT to patient...');
    const tokenMintTransaction = new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([Buffer.from(consentHash, 'hex')]);

    const mintResponse = await tokenMintTransaction.execute(client);
    const mintReceipt = await mintResponse.getReceipt(client);
    const serialNumber = mintReceipt.serials[0].toString();
    
    console.log(`✅ Consent NFT minted!`);
    console.log(`   Serial Number: ${serialNumber}`);
    console.log(`   Transaction ID: ${mintResponse.transactionId.toString()}\n`);

    // 5. Display results
    console.log('🎉 Consent NFT Creation Complete!\n');
    console.log('📋 Transaction IDs to check on Hedera Explorer:');
    console.log(`   HCS Message: ${hcsResponse.transactionId.toString()}`);
    console.log(`   NFT Creation: ${nftResponse.transactionId.toString()}`);
    console.log(`   NFT Minting: ${mintResponse.transactionId.toString()}\n`);

    console.log('🔍 View on Hedera Explorer:');
    console.log(`   HCS Message: https://hashscan.io/testnet/transaction/${hcsResponse.transactionId.toString()}`);
    console.log(`   NFT Creation: https://hashscan.io/testnet/transaction/${nftResponse.transactionId.toString()}`);
    console.log(`   NFT Minting: https://hashscan.io/testnet/transaction/${mintResponse.transactionId.toString()}`);
    console.log(`   Token: https://hashscan.io/testnet/token/${tokenId}\n`);

    console.log('🎯 NFT Details:');
    console.log(`   Token ID: ${tokenId}`);
    console.log(`   Serial Number: ${serialNumber}`);
    console.log(`   Owner: ${operatorId.toString()}`);
    console.log(`   Consent Hash: ${consentHash}`);

  } catch (error) {
    console.error('❌ Error creating consent NFT:', error);
  }
}

// Run the test
testConsentNFT();
