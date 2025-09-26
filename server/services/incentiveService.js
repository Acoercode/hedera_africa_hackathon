const { TokenId, TransferTransaction, AccountId, Hbar, AccountBalanceQuery, TokenAssociateTransaction } = require('@hashgraph/sdk');

class IncentiveService {
  constructor(hederaService) {
    this.hederaService = hederaService;
    this.incentiveTokenId = process.env.HEDERA_RDZ_INCENTIVE_TOKEN_ID || '0.0.6894102';
    
    // Incentive amounts for different actions
    this.incentiveAmounts = {
      data_sync: 100,        // 100 tokens for data sync consent
      research_consent: 150, // 150 tokens for research consent
      passport_creation: 200 // 200 tokens for passport creation
    };
  }

  /**
   * Check if an account is associated with the incentive token
   * @param {string} accountId - The account ID to check
   * @returns {Promise<boolean>} - True if associated, false otherwise
   */
  async isAccountAssociated(accountId) {
    try {
      const accountIdObj = AccountId.fromString(accountId);
      const tokenId = TokenId.fromString(this.incentiveTokenId);
      
      const balanceQuery = new AccountBalanceQuery()
        .setAccountId(accountIdObj);
      
      const balance = await balanceQuery.execute(this.hederaService.client);
      
      // Check if the account has the incentive token in its balance
      if (balance.tokens && balance.tokens._map) {
        return balance.tokens._map.has(this.incentiveTokenId);
      }
      
      return false;
    } catch (error) {
      console.error(`Error checking token association for ${accountId}:`, error);
      return false;
    }
  }

  /**
   * Automatically associate an account with the incentive token (admin signs)
   * @param {string} accountId - The account ID to associate
   * @returns {Promise<Object>} - Association result
   */
  async associateAccountWithToken(accountId) {
    try {
      console.log(`🔗 Admin associating account ${accountId} with incentive token ${this.incentiveTokenId}`);
      
      const accountIdObj = AccountId.fromString(accountId);
      const tokenId = TokenId.fromString(this.incentiveTokenId);
      
      // Create association transaction - admin signs on behalf of user
      const associateTx = new TokenAssociateTransaction()
        .setAccountId(accountIdObj)
        .setTokenIds([tokenId])
        .freezeWith(this.hederaService.client);
      
      // Admin signs the transaction
      const signedTx = associateTx.sign(this.hederaService.operatorKey);
      const associateResponse = await signedTx.execute(this.hederaService.client);
      const associateReceipt = await associateResponse.getReceipt(this.hederaService.client);
      
      console.log(`✅ Account ${accountId} successfully associated with incentive token ${this.incentiveTokenId}`);
      console.log(`📋 Association Transaction ID: ${associateResponse.transactionId.toString()}`);
      
      return {
        success: true,
        transactionId: associateResponse.transactionId.toString(),
        accountId: accountId,
        tokenId: this.incentiveTokenId
      };
      
    } catch (error) {
      console.error(`❌ Error associating account ${accountId} with incentive token:`, error);
      return {
        success: false,
        error: error.message,
        accountId: accountId,
        tokenId: this.incentiveTokenId
      };
    }
  }

  /**
   * Mint and transfer incentive tokens to a user
   * @param {string} recipientAccountId - The user's Hedera account ID
   * @param {string} action - The action that triggered the incentive (data_sync, research_consent, passport_creation)
   * @param {string} consentId - The consent ID for tracking
   * @returns {Promise<Object>} - Transaction details and amount
   */
  async mintAndTransferIncentive(recipientAccountId, action, consentId) {
    try {
      console.log(`🎁 Starting incentive transfer for action: ${action}, recipient: ${recipientAccountId}`);
      console.log(`🔧 Incentive service config:`, {
        tokenId: this.incentiveTokenId,
        operatorId: this.hederaService.operatorId?.toString(),
        clientInitialized: !!this.hederaService.client,
        operatorKeyExists: !!this.hederaService.operatorKey
      });

      const amount = this.incentiveAmounts[action];
      if (!amount) {
        throw new Error(`Unknown incentive action: ${action}`);
      }

      // Check if recipient is associated with the incentive token
      const isAssociated = await this.isAccountAssociated(recipientAccountId);
      console.log(`🔍 Account ${recipientAccountId} associated with incentive token: ${isAssociated}`);
      
      if (!isAssociated) {
        console.log(`⚠️ Account ${recipientAccountId} not associated with incentive token ${this.incentiveTokenId}`);
        console.log(`💡 User needs to associate with token ${this.incentiveTokenId} to receive ${amount} RDZ tokens`);
        
        return {
          success: false,
          error: 'TOKEN_NOT_ASSOCIATED',
          message: `To receive ${amount} RDZ incentive tokens, please associate your wallet with token ${this.incentiveTokenId}. You can do this in the Wallet tab.`,
          amount: amount,
          action: action,
          recipientAccountId: recipientAccountId,
          tokenId: this.incentiveTokenId,
          requiresAssociation: true,
          instructions: {
            step1: "Go to the Wallet tab",
            step2: "Click 'Associate with RDZ Token'",
            step3: "Sign the association transaction in your wallet",
            step4: "Return to perform the action to receive your tokens"
          }
        };
      }

      console.log(`🎁 Transferring ${amount} incentive tokens for ${action} to account ${recipientAccountId}`);

      const tokenId = TokenId.fromString(this.incentiveTokenId);
      const recipientId = AccountId.fromString(recipientAccountId);

      // Create transfer transaction
      const transferTx = new TransferTransaction()
        .addTokenTransfer(tokenId, this.hederaService.operatorId, -amount) // Deduct from treasury
        .addTokenTransfer(tokenId, recipientId, amount) // Add to recipient
        .setTransactionMemo(`RDZ: ${action}`);

      // Execute the transaction (client is already configured with operator)
      const txResponse = await transferTx.execute(this.hederaService.client);
      const receipt = await txResponse.getReceipt(this.hederaService.client);

      console.log(`✅ Incentive tokens transferred successfully: ${amount} tokens to ${recipientAccountId}`);
      console.log(`📋 Transaction ID: ${txResponse.transactionId.toString()}`);

      return {
        success: true,
        amount: amount,
        action: action,
        recipientAccountId: recipientAccountId,
        transactionId: txResponse.transactionId.toString(),
        receipt: receipt,
        tokenId: this.incentiveTokenId,
        message: `You earned ${amount} RDZ incentive tokens!`
      };

    } catch (error) {
      console.error(`❌ Error minting incentive tokens for ${action}:`, error);
      throw error;
    }
  }

  /**
   * Get incentive amount for a specific action
   * @param {string} action - The action type
   * @returns {number} - The incentive amount
   */
  getIncentiveAmount(action) {
    return this.incentiveAmounts[action] || 0;
  }

  /**
   * Get all incentive amounts
   * @returns {Object} - All incentive amounts
   */
  getAllIncentiveAmounts() {
    return { ...this.incentiveAmounts };
  }

  /**
   * Check for pending airdrops for a user
   * @param {string} accountId - The account ID to check
   * @returns {Promise<Object>} - Pending airdrops information
   */
  async getPendingAirdrops(accountId) {
    try {
      // This would typically query the Hedera Mirror Node API
      // For now, we'll return a placeholder response
      console.log(`🔍 Checking pending airdrops for account ${accountId}`);
      
      // TODO: Implement actual mirror node query
      // const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/airdrops/pending`);
      
      return {
        success: true,
        accountId: accountId,
        pendingAirdrops: [],
        message: 'No pending airdrops found'
      };
    } catch (error) {
      console.error(`Error checking pending airdrops for ${accountId}:`, error);
      return {
        success: false,
        error: error.message,
        accountId: accountId
      };
    }
  }
}

module.exports = IncentiveService;