const express = require('express');
const { AccountBalanceQuery, AccountId } = require('@hashgraph/sdk');
const hederaService = require('../services/hederaService');
const router = express.Router();

// GET /api/incentives/balance/:accountId - Get incentive token balance for user
router.get('/balance/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID is required'
      });
    }

    // Get the incentive token ID from environment
    const incentiveTokenId = process.env.HEDERA_RDZ_INCENTIVE_TOKEN_ID || '0.0.6894102';
    
    console.log(`🔍 Checking incentive token balance for account ${accountId}`);
    
    // Query account balance
    const accountIdObj = AccountId.fromString(accountId);
    const balanceQuery = new AccountBalanceQuery()
      .setAccountId(accountIdObj);
    
    const balance = await balanceQuery.execute(hederaService.client);
    
    // Find the incentive token balance
    let incentiveBalance = 0;
    if (balance.tokens && balance.tokens._map) {
      const tokenBalance = balance.tokens._map.get(incentiveTokenId);
      if (tokenBalance) {
        incentiveBalance = tokenBalance.toNumber();
      }
    }
    
    console.log(`💰 Incentive token balance for ${accountId}: ${incentiveBalance} tokens`);
    
    res.json({
      success: true,
      balance: incentiveBalance,
      tokenId: incentiveTokenId,
      accountId: accountId
    });
    
  } catch (error) {
    console.error('Error fetching incentive balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incentive balance',
      error: error.message
    });
  }
});

// GET /api/incentives/association-info/:accountId - Get association information for user
router.get('/association-info/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID is required'
      });
    }

    const incentiveTokenId = process.env.HEDERA_RDZ_INCENTIVE_TOKEN_ID || '0.0.6894102';
    
    // Check if account is associated
    const isAssociated = await hederaService.incentiveService.isAccountAssociated(accountId);
    
    res.json({
      success: true,
      accountId: accountId,
      tokenId: incentiveTokenId,
      isAssociated: isAssociated,
      tokenInfo: {
        symbol: 'RDZ',
        name: 'RDZ Health Incentive Token',
        decimals: 2
      },
      associationRequired: !isAssociated
    });
    
  } catch (error) {
    console.error('Error checking association info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check association info',
      error: error.message
    });
  }
});

// GET /api/incentives/rates - Get incentive rates for different actions
router.get('/rates', async (req, res) => {
  try {
    const incentiveService = hederaService.incentiveService;
    
    if (!incentiveService) {
      return res.status(500).json({
        success: false,
        message: 'Incentive service not available'
      });
    }
    
    const rates = incentiveService.getAllIncentiveAmounts();
    
    res.json({
      success: true,
      rates: rates,
      description: 'RDZ incentive token amounts for different actions',
      tokenId: process.env.HEDERA_RDZ_INCENTIVE_TOKEN_ID || '0.0.6894102'
    });
    
  } catch (error) {
    console.error('Error fetching incentive rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incentive rates',
      error: error.message
    });
  }
});

// GET /api/incentives/pending-airdrops/:accountId - Check for pending airdrops
router.get('/pending-airdrops/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    if (!accountId) {
      return res.status(400).json({ success: false, message: 'Account ID is required' });
    }

    const pendingAirdrops = await hederaService.incentiveService.getPendingAirdrops(accountId);
    res.json(pendingAirdrops);
    
  } catch (error) {
    console.error('Error checking pending airdrops:', error);
    res.status(500).json({ success: false, message: 'Failed to check pending airdrops', error: error.message });
  }
});

module.exports = router;