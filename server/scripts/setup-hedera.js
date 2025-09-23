// setupHedera.js
const {
  Client,
  PrivateKey,
  AccountId,
  TopicCreateTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  Hbar,
} = require("@hashgraph/sdk");
require("dotenv").config();

async function setupHedera() {
  try {
    console.log("🚀 Setting up Hedera resources...\n");

    // --- ENV & client ---
    const network = process.env.HEDERA_NETWORK || "testnet";
    const OP_ID = process.env.HEDERA_OPERATOR_ID;
    const OP_KEY = process.env.HEDERA_OPERATOR_KEY;

    if (!OP_ID || !OP_KEY) {
      console.log("❌ Missing required env:");
      console.log("   HEDERA_OPERATOR_ID (e.g., 0.0.123456)");
      console.log("   HEDERA_OPERATOR_KEY (private key)\n");
      return;
    }

    const operatorId = AccountId.fromString(OP_ID);
    const operatorKey = PrivateKey.fromString(OP_KEY);
    const client = Client.forName(network).setOperator(operatorId, operatorKey);

    console.log(`👤 Operator: ${operatorId.toString()} (${network})\n`);

    // Collect results (use existing if provided)
    const results = {
      consentTopicId: process.env.HEDERA_CONSENT_TOPIC_ID || null,
      genomicTopicId: process.env.HEDERA_GENOMIC_TOPIC_ID || null,
      incentiveTokenId: process.env.HEDERA_INCENTIVE_TOKEN_ID || null,
      consentNftTokenId: process.env.HEDERA_CONSENT_NFT_ID || null,
      passportNftTokenId: process.env.HEDERA_PASSPORT_NFT_ID || null,
    };

    // --- 1) Consent Topic (HCS) ---
    if (!results.consentTopicId) {
      console.log("📋 Creating Consent Topic...");
      const tx = await new TopicCreateTransaction()
        .setTopicMemo("Genomic Data Mesh - Consent Management")
        .setSubmitKey(operatorKey.publicKey) // use PUBLIC key
        .freezeWith(client)
        .sign(operatorKey);

      const rx = await (await tx.execute(client)).getReceipt(client);
      results.consentTopicId = rx.topicId.toString();
      console.log(`✅ Consent Topic: ${results.consentTopicId}`);
    } else {
      console.log(`📋 Using existing Consent Topic: ${results.consentTopicId}`);
    }

    // --- 2) Genomic Data Topic (HCS) ---
    if (!results.genomicTopicId) {
      console.log("🧬 Creating Genomic Data Topic...");
      const tx = await new TopicCreateTransaction()
        .setTopicMemo("Genomic Data Mesh - Data Access Logs")
        .setSubmitKey(operatorKey.publicKey)
        .freezeWith(client)
        .sign(operatorKey);

      const rx = await (await tx.execute(client)).getReceipt(client);
      results.genomicTopicId = rx.topicId.toString();
      console.log(`✅ Genomic Topic: ${results.genomicTopicId}`);
    } else {
      console.log(`🧬 Using existing Genomic Topic: ${results.genomicTopicId}`);
    }

    // --- 3) Fungible Incentive Token (FungibleCommon, INFINITE) ---
    if (!results.incentiveTokenId) {
      console.log("💰 Creating Fungible Incentive Token (GDI)...");
      const tx = await new TokenCreateTransaction()
        .setTokenName("Genomic Data Incentive Token")
        .setTokenSymbol("GDI")
        .setTokenType(TokenType.FungibleCommon)
        .setTreasuryAccountId(operatorId)
        .setDecimals(2)
        .setInitialSupply(1_000_000)              // start with 1M
        .setSupplyType(TokenSupplyType.Infinite)  // can mint more later
        .setTokenMemo("Incentive tokens for genomic data sharing")
        .setAutoRenewAccountId(operatorId)
        .setAutoRenewPeriod(60 * 60 * 24 * 90)    // 90 days
        .setMaxTransactionFee(new Hbar(10))
        .freezeWith(client)
        .sign(operatorKey);

      const rx = await (await tx.execute(client)).getReceipt(client);
      results.incentiveTokenId = rx.tokenId.toString();
      console.log(`✅ Incentive Token: ${results.incentiveTokenId}`);
    } else {
      console.log(`💰 Using existing Incentive Token: ${results.incentiveTokenId}`);
    }

    // --- 4) Consent NFT (NonFungibleUnique, INFINITE) ---
    if (!results.consentNftTokenId) {
      console.log("🖼️ Creating Consent NFT (infinite supply)...");
      const tx = await new TokenCreateTransaction()
        .setTokenName("Ziva Health Consent NFT")                  // readable name
        .setTokenSymbol("ZIVACONSENT")                    // clean symbol (no hyphen)
        .setTokenType(TokenType.NonFungibleUnique)    // NFT
        .setTreasuryAccountId(operatorId)
        .setSupplyType(TokenSupplyType.Infinite)      // INFINITE supply
        .setSupplyKey(operatorKey.publicKey)          // supplyKey controls minting
        .setTokenMemo("Consent proofs (hash on-chain; full text off-chain)")
        .setAutoRenewAccountId(operatorId)
        .setAutoRenewPeriod(60 * 60 * 24 * 90)
        .setMaxTransactionFee(new Hbar(10))
        .freezeWith(client)
        .sign(operatorKey);

      const rx = await (await tx.execute(client)).getReceipt(client);
      results.consentNftTokenId = rx.tokenId.toString();
      console.log(`✅ Consent NFT Token: ${results.consentNftTokenId}`);
    } else {
      console.log(`🖼️ Using existing Consent NFT Token: ${results.consentNftTokenId}`);
    }

      // --- 5) Passport NFT (NonFungibleUnique, INFINITE) ---
      if (!results.passportNftTokenId) {
        console.log("🖼️ Creating Consent NFT (infinite supply)...");
        const tx = await new TokenCreateTransaction()
          .setTokenName("Ziva Health Passport NFT")                  // readable name
          .setTokenSymbol("ZIVAPASSPORT")                    // clean symbol (no hyphen)
          .setTokenType(TokenType.NonFungibleUnique)    // NFT
          .setTreasuryAccountId(operatorId)
          .setSupplyType(TokenSupplyType.Infinite)      // INFINITE supply
          .setSupplyKey(operatorKey.publicKey)          // supplyKey controls minting
          .setTokenMemo("Consent proofs (hash on-chain; full text off-chain)")
          .setAutoRenewAccountId(operatorId)
          .setAutoRenewPeriod(60 * 60 * 24 * 90)
          .setMaxTransactionFee(new Hbar(10))
          .freezeWith(client)
          .sign(operatorKey);
  
        const rx = await (await tx.execute(client)).getReceipt(client);
        results.passportNftTokenId = rx.tokenId.toString();
        console.log(`✅ Consent NFT Token: ${results.passportNftTokenId}`);
      } else {
        console.log(`🖼️ Using existing Consent NFT Token: ${results.passportNftTokenId}`);
      }

    // --- Summary / Output ---
    console.log("\n🎉 Hedera setup complete!\n");
    console.log("📋 Add/update these in your .env:\n");
    if (results.consentTopicId)    console.log(`HEDERA_CONSENT_TOPIC_ID=${results.consentTopicId}`);
    if (results.genomicTopicId)    console.log(`HEDERA_GENOMIC_TOPIC_ID=${results.genomicTopicId}`);
    if (results.incentiveTokenId)  console.log(`HEDERA_INCENTIVE_TOKEN_ID=${results.incentiveTokenId}`);
    if (results.consentNftTokenId) console.log(`HEDERA_CONSENT_NFT_ID=${results.consentNftTokenId}`);
    if (results.passportNftTokenId) console.log(`HEDERA_PASSPORT_NFT_ID=${results.passportNftTokenId}`);

    console.log("\n🔍 View on HashScan:");
    if (results.consentTopicId)    console.log(`   Consent Topic:  https://hashscan.io/${network}/topic/${results.consentTopicId}`);
    if (results.genomicTopicId)    console.log(`   Genomic Topic:  https://hashscan.io/${network}/topic/${results.genomicTopicId}`);
    if (results.incentiveTokenId)  console.log(`   Incentive Token: https://hashscan.io/${network}/token/${results.incentiveTokenId}`);
    if (results.consentNftTokenId) console.log(`   Consent NFT:     https://hashscan.io/${network}/token/${results.consentNftTokenId}\n`);
    if (results.passportNftTokenId) console.log(`   Passport NFT:     https://hashscan.io/${network}/token/${results.passportNftTokenId}\n`);
    
    console.log("💡 Next:");
    console.log("   • Frontend: user associates HEDERA_CONSENT_NFT_ID");
    console.log("   • Backend: mint NFT (+metadata hash) and transfer to user\n");
    console.log("   • Frontend: user associates HEDERA_PASSPORT_NFT_ID");
    console.log("   • Backend: mint NFT (+metadata hash) and transfer to user\n");
    console.log("   • Frontend: user associates HEDERA_CONSENT_NFT_ID");
    console.log("   • Backend: mint NFT (+metadata hash) and transfer to user\n");
    console.log("   • Frontend: user associates HEDERA_CONSENT_NFT_ID");
    console.log("   • Backend: mint NFT (+metadata hash) and transfer to user\n");
  } catch (error) {
    console.error("❌ Error setting up Hedera resources:", error);
    console.error("💡 Make sure you have:");
    console.error("   1) Valid Hedera account on the chosen network");
    console.error("   2) Enough HBAR for creation fees");
    console.error("   3) Correct HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY");
    process.exit(1);
  }
}

// Run the setup
setupHedera();