const express = require('express');
const router = express.Router();
const incentiveService = require('../services/incentiveService');
const hederaService = require('../services/hederaService');
const User = require('../models/User');

// GET /api/incentives/rates - Get incentive rates
router.get('/rates', async (req, res) => {
  try {
    const rates = incentiveService.getIncentiveRates();
    res.json(rates);
  } catch (error) {
    console.error('Error fetching incentive rates:', error);
    res.status(500).json({ error: 'Failed to fetch incentive rates' });
  }
});

// GET /api/incentives/balance/:accountId - Get incentive balance for account
router.get('/balance/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const balance = await incentiveService.getIncentiveBalance(accountId);
    res.json(balance);
  } catch (error) {
    console.error('Error fetching incentive balance:', error);
    res.status(500).json({ error: 'Failed to fetch incentive balance' });
  }
});

// GET /api/incentives/history/:accountId - Get incentive history for account
router.get('/history/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const history = await incentiveService.getIncentiveHistory(accountId);
    res.json(history);
  } catch (error) {
    console.error('Error fetching incentive history:', error);
    res.status(500).json({ error: 'Failed to fetch incentive history' });
  }
});

// POST /api/incentives/distribute - Manually distribute incentives
router.post('/distribute', async (req, res) => {
  try {
    const { recipientAccountId, action, dataType, amount } = req.body;

    if (!recipientAccountId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await incentiveService.distributeIncentives(
      recipientAccountId,
      action,
      dataType,
      amount
    );

    res.json({
      success: true,
      result,
      message: `Distributed ${result.amount} GDI tokens to ${recipientAccountId}`
    });
  } catch (error) {
    console.error('Error distributing incentives:', error);
    res.status(500).json({ error: 'Failed to distribute incentives' });
  }
});

// POST /api/incentives/initialize - Initialize incentive token (admin only)
router.post('/initialize', async (req, res) => {
  try {
    const result = await hederaService.createIncentiveToken();
    res.json({
      success: true,
      result,
      message: 'Incentive token created successfully'
    });
  } catch (error) {
    console.error('Error initializing incentive token:', error);
    res.status(500).json({ error: 'Failed to initialize incentive token' });
  }
});

module.exports = router;
