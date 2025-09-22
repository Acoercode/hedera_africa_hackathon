const { Client, PrivateKey, AccountId, TopicCreateTransaction, TokenCreateTransaction, TokenType, TokenSupplyType } = require('@hashgraph/sdk');
require('dotenv').config();

async function createHederaResources() {
  try {
    console.log('🚀 Creating Hedera Resources for Genomic Data Mesh...\n');

    // Initialize Hedera client
    const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID || '0.0.123456');
    const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY || '302e020100300506032b657004220420...');
    
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);
    
    console.log(`👤 Using operator account: ${operatorId.toString()}\n`);

    // 1. Create Consent Topic
    console.log('📋 Creating Consent Topic...');
    const consentTopicTransaction = new TopicCreateTransaction()
      .setTopicMemo('Genomic Data Mesh - Consent Management')
      .setSubmitKey(operatorKey);

    const consentTopicResponse = await consentTopicTransaction.execute(client);
    const consentTopicReceipt = await consentTopicResponse.getReceipt(client);
    const consentTopicId = consentTopicReceipt.topicId.toString();
    
    console.log(`✅ Consent Topic Created: ${consentTopicId}`);
    console.log(`   Transaction ID: ${consentTopicResponse.transactionId.toString()}\n`);

    // 2. Create Genomic Data Topic
    console.log('🧬 Creating Genomic Data Topic...');
    const genomicTopicTransaction = new TopicCreateTransaction()
      .setTopicMemo('Genomic Data Mesh - Data Access Logs')
      .setSubmitKey(operatorKey);

    const genomicTopicResponse = await genomicTopicTransaction.execute(client);
    const genomicTopicReceipt = await genomicTopicResponse.getReceipt(client);
    const genomicTopicId = genomicTopicReceipt.topicId.toString();
    
    console.log(`✅ Genomic Data Topic Created: ${genomicTopicId}`);
    console.log(`   Transaction ID: ${genomicTopicResponse.transactionId.toString()}\n`);

    // 3. Create Incentive Token
    console.log('💰 Creating Incentive Token (GDI)...');
    const incentiveTokenTransaction = new TokenCreateTransaction()
      .setTokenName("Genomic Data Incentive Token")
      .setTokenSymbol("GDI")
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(2)
      .setInitialSupply(1000000) // 1M tokens
      .setTreasuryAccountId(operatorId)
      .setSupplyType(TokenSupplyType.Infinite)
      .setTokenMemo("Incentive tokens for genomic data sharing");

    const incentiveTokenResponse = await incentiveTokenTransaction.execute(client);
    const incentiveTokenReceipt = await incentiveTokenResponse.getReceipt(client);
    const incentiveTokenId = incentiveTokenReceipt.tokenId.toString();
    
    console.log(`✅ Incentive Token Created: ${incentiveTokenId}`);
    console.log(`   Transaction ID: ${incentiveTokenResponse.transactionId.toString()}\n`);

    // 4. Display Environment Variables
    console.log('🔧 Add these to your .env file:\n');
    console.log('# Hedera Configuration');
    console.log(`HEDERA_OPERATOR_ID=${operatorId.toString()}`);
    console.log(`HEDERA_OPERATOR_KEY=${operatorKey.toString()}`);
    console.log(`HEDERA_CONSENT_TOPIC_ID=${consentTopicId}`);
    console.log(`HEDERA_GENOMIC_TOPIC_ID=${genomicTopicId}`);
    console.log(`HEDERA_INCENTIVE_TOKEN_ID=${incentiveTokenId}\n`);

    // 5. Display Explorer Links
    console.log('🔍 View on Hedera Explorer:');
    console.log(`   Consent Topic: https://hashscan.io/testnet/topic/${consentTopicId}`);
    console.log(`   Genomic Topic: https://hashscan.io/testnet/topic/${genomicTopicId}`);
    console.log(`   Incentive Token: https://hashscan.io/testnet/token/${incentiveTokenId}\n`);

    console.log('🎉 All Hedera resources created successfully!');
    console.log('💡 You can now start your server with these environment variables.');

  } catch (error) {
    console.error('❌ Error creating Hedera resources:', error);
    process.exit(1);
  }
}

// Run the script
createHederaResources();
