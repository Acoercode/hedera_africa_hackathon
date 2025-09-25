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
      researchConsentTopicId: process.env.HEDERA_RESEARCH_CONSENT_TOPIC_ID || null,
      genomicSyncTopicId: process.env.HEDERA_DATA_SYNC_TOPIC_ID || null,
      genomicPassportTopicId: process.env.HEDERA_PASSPORT_TOPIC_ID || null,
      rdzIncentiveTokenId: process.env.HEDERA_RDZ_INCENTIVE_TOKEN_ID || null,
      researchConsentNFTTokenId: process.env.HEDERA_RESEARCH_CONSENT_NFT_ID || null,
      genomicDataPassportNFTTokenId: process.env.HEDERA_PASSPORT_NFT_ID || null,
      syncDataConsentNFTTokenId: process.env.HEDERA_DATA_SYNC_NFT_ID || null,
    };

    // --- 1) Consent Topic (HCS) ---
    if (!results.researchConsentTopicId) {
      console.log("📋 Creating Research Consent Topic...");
      const tx = await new TopicCreateTransaction()
        .setTopicMemo("RDZ Health - Research Consent Management")
        .setSubmitKey(operatorKey.publicKey) // use PUBLIC key
        .freezeWith(client)
        .sign(operatorKey);

      const rx = await (await tx.execute(client)).getReceipt(client);
      results.researchConsentTopicId = rx.topicId.toString();
      console.log(`✅ Consent Topic: ${results.researchConsentTopicId}`);
    } else {
      console.log(`📋 Using existing Consent Topic: ${results.researchConsentTopicId}`);
    }

    // --- 2) Genomic Data Sync Topic (HCS) ---
    if (!results.genomicSyncTopicId) {
      console.log("🧬 Creating Genomic Sync Data Topic...");
      const tx = await new TopicCreateTransaction()
        .setTopicMemo("RDZ Health - Data Sync Management")
        .setSubmitKey(operatorKey.publicKey)
        .freezeWith(client)
        .sign(operatorKey);

      const rx = await (await tx.execute(client)).getReceipt(client);
      results.genomicSyncTopicId = rx.topicId.toString();
      console.log(`✅ Genomic Topic: ${results.genomicSyncTopicId}`);
    } else {
      console.log(`🧬 Using existing Genomic Topic: ${results.genomicSyncTopicId}`);
    }

    // --- 2) Genomic Passport Topic (HCS) ---
    if (!results.genomicPassportTopicId) {
      console.log("🧬 Creating Genomic Passport Topic...");
      const tx = await new TopicCreateTransaction()
        .setTopicMemo("RDZ Health - Passport Management")
        .setSubmitKey(operatorKey.publicKey)
        .freezeWith(client)
        .sign(operatorKey);

      const rx = await (await tx.execute(client)).getReceipt(client);
      results.genomicPassportTopicId = rx.topicId.toString();
      console.log(`✅ Genomic Topic: ${results.genomicPassportTopicId}`);
    } else {
      console.log(`🧬 Using existing Genomic Topic: ${results.genomicPassportTopicId}`);
    }

    // --- 3) Fungible Incentive Token (FungibleCommon, INFINITE) ---
    if (!results.rdzIncentiveTokenId) {
      console.log("💰 Creating Fungible Incentive Token (RDZ)...");
      const tx = await new TokenCreateTransaction()
        .setTokenName("RDZ Health Incentive Token")
        .setTokenSymbol("RDZ")
        .setTokenType(TokenType.FungibleCommon)
        .setTreasuryAccountId(operatorId)
        .setDecimals(2)
        .setInitialSupply(1_000_000)              // start with 1M
        .setSupplyType(TokenSupplyType.Infinite)  // can mint more later
        .setTokenMemo("Incentive tokens for RDZ Health genomic data sharing")
        .setAutoRenewAccountId(operatorId)
        .setAutoRenewPeriod(60 * 60 * 24 * 90)    // 90 days
        .setMaxTransactionFee(new Hbar(10))
        .freezeWith(client)
        .sign(operatorKey);

      const rx = await (await tx.execute(client)).getReceipt(client);
      results.rdzIncentiveTokenId = rx.tokenId.toString();
      console.log(`✅ Incentive Token: ${results.rdzIncentiveTokenId}`);
    } else {
      console.log(`💰 Using existing Incentive Token: ${results.rdzIncentiveTokenId}`);
    }

    // --- 4) Consent NFT (NonFungibleUnique, INFINITE) ---
    if (!results.researchConsentNFTTokenId) {
      console.log("🖼️ Creating Research Consent NFT (infinite supply)...");
      const tx = await new TokenCreateTransaction()
        .setTokenName("RDZ Health Research Consent NFT")                  // readable name
        .setTokenSymbol("RDZRESEARCH")                    // clean symbol (no hyphen)
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
      results.researchConsentNFTTokenId = rx.tokenId.toString();
      console.log(`✅ Consent NFT Token: ${results.researchConsentNFTTokenId}`);
    } else {
      console.log(`🖼️ Using existing Consent NFT Token: ${results.researchConsentNFTTokenId}`);
    }

      // --- 5) Passport NFT (NonFungibleUnique, INFINITE) ---
      if (!results.genomicDataPassportNFTTokenId) {
        console.log("🖼️ Creating RDZ Health Passport NFT (infinite supply)...");
        const tx = await new TokenCreateTransaction()
          .setTokenName("RDZ Health Passport NFT")                  // readable name
          .setTokenSymbol("RDZPASSPORT")                    // clean symbol (no hyphen)
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
        results.genomicDataPassportNFTTokenId = rx.tokenId.toString();
        console.log(`✅ Consent NFT Token: ${results.genomicDataPassportNFTTokenId}`);
      } else {
        console.log(`🖼️ Using existing Consent NFT Token: ${results.genomicDataPassportNFTTokenId}`);
      }

      // --- 5) Passport NFT (NonFungibleUnique, INFINITE) ---
      if (!results.syncDataConsentNFTTokenId) {
        console.log("🖼️ Creating RDZ Health Data Sync Consent NFT (infinite supply)...");
        const tx = await new TokenCreateTransaction()
          .setTokenName("RDZ Health Data Sync Consent NFT")                  // readable name
          .setTokenSymbol("RDZDATASYNC")                    // clean symbol (no hyphen)
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
        results.syncDataConsentNFTTokenId = rx.tokenId.toString();
        console.log(`✅ Consent NFT Token: ${results.syncDataConsentNFTTokenId}`);
      } else {
        console.log(`🖼️ Using existing Consent NFT Token: ${results.syncDataConsentNFTTokenId}`);
      }

    // --- Summary / Output ---
    console.log("\n🎉 Hedera setup complete!\n");
    console.log("📋 Add/update these in your .env:\n");
    if (results.researchConsentTopicId)    console.log(`HEDERA_RESEARCH_CONSENT_TOPIC_ID=${results.researchConsentTopicId}`);
    if (results.genomicSyncTopicId)    console.log(`HEDERA_DATA_SYNC_TOPIC_ID=${results.genomicSyncTopicId}`);
    if (results.genomicPassportTopicId)    console.log(`HEDERA_PASSPORT_TOPIC_ID=${results.genomicSyncTopicId}`);
    if (results.incentiveTokenId)  console.log(`HEDERA_INCENTIVE_TOKEN_ID=${results.incentiveTokenId}`);
    if (results.researchConsentNFTTokenId) console.log(`HEDERA_RESEARCH_CONSENT_NFT_ID=${results.consentNftTokenId}`);
    if (results.genomicDataPassportNFTTokenId) console.log(`HEDERA_PASSPORT_NFT_ID=${results.passportNftTokenId}`);
    if (results.syncDataConsentNFTTokenId) console.log(`HEDERA_DATA_SYNC_NFT_ID=${results.syncDataConsentNFTTokenId}`);

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