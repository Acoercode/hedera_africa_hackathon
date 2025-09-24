const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// GET /api/users/by-hedera-account/:hederaAccountId - Check if user exists with Hedera account and return genomic data
router.get('/by-hedera-account/:hederaAccountId', async (req, res) => {
  try {
    const { hederaAccountId } = req.params;
    
    const user = await User.findByHederaAccount(hederaAccountId);
    
    if (user) {
      // Get the database connection
      const db = mongoose.connection.db;
      if (!db) {
        return res.status(500).json({ error: 'Database connection not available' });
      }
      
      // Get genomic data for this user using their iHope ID
      const genomicDataCollection = db.collection('genomic_data');
      const genomicData = await genomicDataCollection.find({ ihopeId: user.iHopeId }).toArray();
      
      res.json({
        exists: true,
        user: {
          id: user._id,
          iHopeId: user.iHopeId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          hederaAccountId: user.hederaAccountId,
          lastLoginAt: user.lastLoginAt
        },
        genomicData: genomicData[0]
      });
    } else {
      res.json({
        exists: false
      });
    }
  } catch (error) {
    console.error('Error checking user by Hedera account:', error);
    res.status(500).json({ error: 'Failed to check user existence' });
  }
});

// GET /api/users/search/:iHopeId - Search for user by iHope ID in genomic data collection
router.get('/search/:iHopeId', async (req, res) => {
  try {
    const { iHopeId } = req.params;
    
    // Get the database connection
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }
    
    // Query the genomic_data collection directly
    const genomicDataCollection = db.collection('genomic_data');
    const genomicRecord = await genomicDataCollection.findOne({ ihopeId: iHopeId });
    
    if (genomicRecord) {
      res.json({
        found: true,
        user: {
          iHopeId: genomicRecord.ihopeId,
          firstName: genomicRecord.name,
          lastName: genomicRecord.surname,
          email: genomicRecord.email,
          dateOfBirth: genomicRecord.dob
        }
      });
    } else {
      res.json({
        found: false,
        message: 'iHope ID not found in genomic data collection'
      });
    }
  } catch (error) {
    console.error('Error searching for user in genomic data:', error);
    res.status(500).json({ error: 'Failed to search for user in genomic data collection' });
  }
});

// POST /api/users/verify-and-create - Verify date of birth against genomic data and create user account
router.post('/verify-and-create', async (req, res) => {
  try {
    const { iHopeId, dateOfBirth, hederaAccountId } = req.body;
    
    if (!iHopeId || !dateOfBirth || !hederaAccountId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: iHopeId, dateOfBirth, hederaAccountId' 
      });
    }
    
    // Get the database connection
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection not available' 
      });
    }
    
    // Query the genomic_data collection directly
    const genomicDataCollection = db.collection('genomic_data');
    const genomicRecord = await genomicDataCollection.findOne({ ihopeId: iHopeId });
    
    if (!genomicRecord) {
      return res.json({
        success: false,
        message: 'iHope ID not found in genomic data collection'
      });
    }
    
    // Verify date of birth matches the one in genomic data
    const genomicDOB = new Date(genomicRecord.dob).toISOString().split('T')[0];
    const providedDOB = new Date(dateOfBirth).toISOString().split('T')[0];
    
    if (genomicDOB !== providedDOB) {
      return res.json({
        success: false,
        message: 'Date of birth does not match the one in our genomic data records',
        debug: {
          genomicDOB,
          providedDOB,
          genomicRecordDOB: genomicRecord.dob,
          providedDateOfBirth: dateOfBirth
        }
      });
    }
    
    // Check if Hedera account is already linked to another user
    const existingUser = await User.findByHederaAccount(hederaAccountId);
    if (existingUser) {
      return res.json({
        success: false,
        message: 'This Hedera account is already linked to another user'
      });
    }
    
    // Check if this iHope ID is already linked to another Hedera account
    const existingUserByIHope = await User.findByIHopeId(iHopeId);
    if (existingUserByIHope) {
      return res.json({
        success: false,
        message: 'This iHope ID is already linked to another Hedera account'
      });
    }
    
    // Create new user account linking iHope ID to Hedera account
    const newUser = new User({
      iHopeId: genomicRecord.ihopeId,
      hederaAccountId: hederaAccountId,
      firstName: genomicRecord.name,
      lastName: genomicRecord.surname,
      email: genomicRecord.email,
      dateOfBirth: genomicRecord.dob,
      createdAt: new Date(),
      lastLoginAt: new Date()
    });
    
    await newUser.save();
    
    res.json({
      success: true,
      user: {
        id: newUser._id,
        iHopeId: newUser.iHopeId,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        hederaAccountId: newUser.hederaAccountId,
        lastLoginAt: newUser.lastLoginAt
      },
      message: 'Account successfully linked to Hedera wallet using genomic data verification'
    });
    
  } catch (error) {
    console.error('Error verifying and creating user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify and create user account' 
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id,
      iHopeId: user.iHopeId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      hederaAccountId: user.hederaAccountId,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/users/:id/last-login - Update last login time
router.put('/:id/last-login', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await user.updateLastLogin();
    
    res.json({
      success: true,
      lastLoginAt: user.lastLoginAt
    });
  } catch (error) {
    console.error('Error updating last login:', error);
    res.status(500).json({ error: 'Failed to update last login' });
  }
});

module.exports = router;
