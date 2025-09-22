const { Client, PrivateKey, AccountId, AccountInfoQuery } = require('@hashgraph/sdk');
require('dotenv').config();

async function testAccount() {
  try {
    console.log('🔍 Testing Hedera Account Credentials...\n');

    // Get credentials from environment
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;

    console.log(`Account ID: ${operatorId}`);
    console.log(`Private Key: ${operatorKey ? operatorKey.substring(0, 20) + '...' : 'NOT SET'}\n`);

    if (!operatorId || !operatorKey) {
      console.log('❌ Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY in .env file');
      return;
    }

    // Initialize client
    const client = Client.forTestnet();
    const accountId = AccountId.fromString(operatorId);
    const privateKey = PrivateKey.fromString(operatorKey);
    
    client.setOperator(accountId, privateKey);

    console.log('✅ Client initialized successfully');

    // Test account info query
    console.log('🔍 Querying account information...');
    const accountInfo = await new AccountInfoQuery()
      .setAccountId(accountId)
      .execute(client);

    console.log('✅ Account query successful!');
    console.log(`   Account ID: ${accountInfo.accountId.toString()}`);
    console.log(`   Balance: ${accountInfo.balance.toString()} tinybars`);
    console.log(`   Balance (HBAR): ${accountInfo.balance.toBigNumber().dividedBy(100000000).toString()} HBAR`);
    console.log(`   Key: ${accountInfo.key.toString()}`);

    // Check if balance is sufficient
    const balanceHBAR = accountInfo.balance.toBigNumber().dividedBy(100000000);
    if (balanceHBAR.isLessThan(1)) {
      console.log('\n⚠️  WARNING: Low HBAR balance!');
      console.log('   You need at least 1-2 HBAR to create topics and tokens.');
      console.log('   Get testnet HBAR from: https://portal.hedera.com/');
    } else {
      console.log('\n✅ Sufficient HBAR balance for creating resources!');
    }

  } catch (error) {
    console.error('❌ Error testing account:', error.message);
    
    if (error.message.includes('INVALID_SIGNATURE')) {
      console.log('\n💡 Possible solutions:');
      console.log('   1. Check your private key format');
      console.log('   2. Make sure you\'re using testnet credentials');
      console.log('   3. Verify your account ID is correct');
    } else if (error.message.includes('INSUFFICIENT_ACCOUNT_BALANCE')) {
      console.log('\n💡 Get testnet HBAR from: https://portal.hedera.com/');
    }
  }
}

testAccount();
