const { Client, PrivateKey, AccountId, TopicCreateTransaction, TokenCreateTransaction, TokenType, TokenSupplyType } = require('@hashgraph/sdk');
require('dotenv').config();

async function setupHedera() {
  try {
    console.log('🚀 Setting up Hedera Resources for Genomic Data Mesh...\n');

    // Check if we have the required environment variables
    if (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_KEY) {
      console.log('❌ Missing required environment variables:');
      console.log('   HEDERA_OPERATOR_ID - Your Hedera account ID (e.g., 0.0.123456)');
      console.log('   HEDERA_OPERATOR_KEY - Your Hedera private key\n');
      console.log('💡 Get these from: https://portal.hedera.com/');
      console.log('💡 Or create a testnet account at: https://portal.hedera.com/');
      return;
    }

    // Initialize Hedera client
    const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID);
    const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY);
    
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);
    
    console.log(`👤 Using operator account: ${operatorId.toString()}\n`);

    const results = {};

    // 1. Create Consent Topic (if not exists)
    if (!process.env.HEDERA_CONSENT_TOPIC_ID) {
      console.log('📋 Creating Consent Topic...');
      const consentTopicTransaction = new TopicCreateTransaction()
        .setTopicMemo('Genomic Data Mesh - Consent Management')
        .setSubmitKey(operatorKey);

      const consentTopicResponse = await consentTopicTransaction.execute(client);
      const consentTopicReceipt = await consentTopicResponse.getReceipt(client);
      results.consentTopicId = consentTopicReceipt.topicId.toString();
      
      console.log(`✅ Consent Topic Created: ${results.consentTopicId}`);
    } else {
      results.consentTopicId = process.env.HEDERA_CONSENT_TOPIC_ID;
      console.log(`📋 Using existing Consent Topic: ${results.consentTopicId}`);
    }

    // 2. Create Genomic Data Topic (if not exists)
    if (!process.env.HEDERA_GENOMIC_TOPIC_ID) {
      console.log('🧬 Creating Genomic Data Topic...');
      const genomicTopicTransaction = new TopicCreateTransaction()
        .setTopicMemo('Genomic Data Mesh - Data Access Logs')
        .setSubmitKey(operatorKey);

      const genomicTopicResponse = await genomicTopicTransaction.execute(client);
      const genomicTopicReceipt = await genomicTopicResponse.getReceipt(client);
      results.genomicTopicId = genomicTopicReceipt.topicId.toString();
      
      console.log(`✅ Genomic Data Topic Created: ${results.genomicTopicId}`);
    } else {
      results.genomicTopicId = process.env.HEDERA_GENOMIC_TOPIC_ID;
      console.log(`🧬 Using existing Genomic Data Topic: ${results.genomicTopicId}`);
    }

    // 3. Create Incentive Token (if not exists)
    if (!process.env.HEDERA_INCENTIVE_TOKEN_ID) {
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
      results.incentiveTokenId = incentiveTokenReceipt.tokenId.toString();
      
      console.log(`✅ Incentive Token Created: ${results.incentiveTokenId}`);
    } else {
      results.incentiveTokenId = process.env.HEDERA_INCENTIVE_TOKEN_ID;
      console.log(`💰 Using existing Incentive Token: ${results.incentiveTokenId}`);
    }

    // 4. Display results
    console.log('\n🎉 Hedera Resources Setup Complete!\n');
    console.log('📋 Add these to your .env file:\n');
    console.log(`HEDERA_CONSENT_TOPIC_ID=${results.consentTopicId}`);
    console.log(`HEDERA_GENOMIC_TOPIC_ID=${results.genomicTopicId}`);
    console.log(`HEDERA_INCENTIVE_TOKEN_ID=${results.incentiveTokenId}\n`);

    console.log('🔍 View on Hedera Explorer:');
    console.log(`   Consent Topic: https://hashscan.io/testnet/topic/${results.consentTopicId}`);
    console.log(`   Genomic Topic: https://hashscan.io/testnet/topic/${results.genomicTopicId}`);
    console.log(`   Incentive Token: https://hashscan.io/testnet/token/${results.incentiveTokenId}\n`);

    console.log('💡 You can now start your server with: npm start');

  } catch (error) {
    console.error('❌ Error setting up Hedera resources:', error);
    console.error('💡 Make sure you have:');
    console.error('   1. Valid Hedera testnet account');
    console.error('   2. Sufficient HBAR balance');
    console.error('   3. Correct HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY');
  }
}

// Run the setup
setupHedera();
