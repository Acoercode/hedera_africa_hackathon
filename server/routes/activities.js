const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const hederaService = require('../services/hederaService');
const { v4: uuidv4 } = require('uuid');

// GET /api/activities/user/:userId - Get activities for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, type } = req.query;
    
    let query = { userId };
    if (type) {
      query.activityType = type;
    }
    
    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      activities,
      count: activities.length
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({ error: 'Failed to fetch user activities' });
  }
});

// POST /api/activities/create - Create a new activity with Hedera transaction
router.post('/create', async (req, res) => {
  try {
    const {
      userId,
      activityName,
      activityDescription,
      activityType,
      metadata = {},
      encryptMetadata = false
    } = req.body;
    
    if (!userId || !activityName || !activityDescription || !activityType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, activityName, activityDescription, activityType'
      });
    }
    
    // Create activity record
    const activityId = uuidv4();
    const activity = new Activity({
      activityId,
      userId,
      activityName,
      activityDescription,
      activityType,
      metadata,
      isEncrypted: encryptMetadata
    });
    
    // Encrypt metadata if requested
    if (encryptMetadata && Object.keys(metadata).length > 0) {
      const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key';
      activity.encryptMetadata(encryptionKey);
    }
    
    // Submit activity to Hedera (as a data stamp)
    const hederaResult = await hederaService.submitDataAccessLog({
      patientId: userId,
      action: 'activity_logged',
      purpose: 'audit_trail',
      dataType: 'activity',
      metadata: {
        activityId,
        activityName,
        activityType,
        timestamp: activity.timestamp
      }
    });
    
    // Update activity with transaction ID
    activity.transactionId = hederaResult.transactionId;
    await activity.save();
    
    res.json({
      success: true,
      activity: {
        activityId: activity.activityId,
        activityName: activity.activityName,
        activityDescription: activity.activityDescription,
        activityType: activity.activityType,
        transactionId: activity.transactionId,
        timestamp: activity.timestamp
      },
      message: 'Activity logged successfully on Hedera'
    });
    
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create activity'
    });
  }
});

// GET /api/activities/transaction/:transactionId - Get activity by transaction ID
router.get('/transaction/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const activity = await Activity.findByTransactionId(transactionId);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    res.json({
      success: true,
      activity
    });
  } catch (error) {
    console.error('Error fetching activity by transaction ID:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// GET /api/activities/types - Get available activity types
router.get('/types', (req, res) => {
  res.json({
    success: true,
    activityTypes: [
      {
        type: 'consent',
        name: 'Consent Management',
        description: 'Consent granting, revoking, and management activities'
      },
      {
        type: 'data',
        name: 'Data Operations',
        description: 'Data upload, processing, and management activities'
      },
      {
        type: 'reward',
        name: 'Rewards & Incentives',
        description: 'Token rewards and incentive activities'
      },
      {
        type: 'security',
        name: 'Security & Access',
        description: 'Authentication, authorization, and security events'
      },
      {
        type: 'ai',
        name: 'AI & Analysis',
        description: 'AI model runs and analysis activities'
      },
      {
        type: 'sharing',
        name: 'Data Sharing',
        description: 'Data sharing and collaboration activities'
      }
    ]
  });
});

// GET /api/activities/stats/:userId - Get activity statistics for a user
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stats = await Activity.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: '$count' },
          activityTypes: {
            $push: {
              type: '$_id',
              count: '$count',
              lastActivity: '$lastActivity'
            }
          }
        }
      }
    ]);
    
    const result = stats[0] || { totalActivities: 0, activityTypes: [] };
    
    res.json({
      success: true,
      stats: {
        totalActivities: result.totalActivities,
        activityTypes: result.activityTypes
      }
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ error: 'Failed to fetch activity statistics' });
  }
});

module.exports = router;
