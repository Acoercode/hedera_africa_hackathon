const { Client, AccountId, PrivateKey, TokenCreateTransaction, TokenType, TokenSupplyType, Hbar } = require('@hashgraph/sdk');
require('dotenv').config();

async function createAutoAssociationIncentiveToken() {
  try {
    console.log('🚀 Creating new incentive token with auto-association enabled...');

    // Initialize Hedera client
    const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID || '0.0.123456');
    const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY || '302e020100300506032b657004220420...');
    
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);
    
    console.log(`👤 Operator ID: ${operatorId.toString()}`);

    // Create the incentive token with auto-association enabled
    const tokenCreateTransaction = new TokenCreateTransaction()
      .setTokenName("RDZ Health Incentive Token")
      .setTokenSymbol("RDZ")
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(2)
      .setInitialSupply(1000000) // 1 million tokens
      .setTreasuryAccountId(operatorId)
      .setSupplyType(TokenSupplyType.Infinite)
      .setSupplyKey(operatorKey)
      .setAdminKey(operatorKey)
      .setAutoRenewAccountId(operatorId)
      .setAutoRenewPeriod(7776000) // 90 days
      .setTokenMemo("Incentive tokens for RDZ Health genomic data sharing - Auto Association Enabled")
      .setMaxTransactionFee(new Hbar(30))
      .freezeWith(client);

    // Sign and execute the transaction
    const tokenCreateResponse = await tokenCreateTransaction.execute(client);
    const tokenCreateReceipt = await tokenCreateResponse.getReceipt(client);
    
    const tokenId = tokenCreateReceipt.tokenId;
    
    console.log('✅ New incentive token created successfully!');
    console.log(`🆔 Token ID: ${tokenId.toString()}`);
    console.log(`📝 Token Name: RDZ Health Incentive Token`);
    console.log(`🔤 Token Symbol: RDZ`);
    console.log(`💰 Initial Supply: 1,000,000 tokens`);
    console.log(`🔄 Supply Type: Infinite`);
    console.log(`🏛️ Treasury Account: ${operatorId.toString()}`);
    console.log(`🔗 Auto-Association: ENABLED`);
    
    console.log('\n📋 Add this to your .env file:');
    console.log(`HEDERA_RDZ_INCENTIVE_TOKEN_ID=${tokenId.toString()}`);
    console.log(`REACT_APP_HEDERA_RDZ_INCENTIVE_TOKEN_ID=${tokenId.toString()}`);
    
    console.log('\n🎯 Next steps:');
    console.log('1. Update your .env file with the new token ID');
    console.log('2. Restart your server');
    console.log('3. Test the incentive system - users should now automatically receive tokens!');
    
    return tokenId.toString();
    
  } catch (error) {
    console.error('❌ Error creating incentive token:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createAutoAssociationIncentiveToken()
    .then((tokenId) => {
      console.log(`\n🎉 Success! New incentive token created: ${tokenId}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createAutoAssociationIncentiveToken };
