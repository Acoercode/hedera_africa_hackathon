const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { TopicMessageSubmitTransaction } = require('@hashgraph/sdk');
const chatgptService = require('../services/chatgptService');
const clinvarService = require('../services/clinvarService');
const hederaService = require('../services/hederaService');
const Activity = require('../models/Activity');

// Helper function to log AI activity to Hedera
const logAIToHedera = async (accountId, action, details, activityId) => {
  try {
    if (!hederaService.initialized || !hederaService.genomicTopicId) {
      return null;
    }

    const hederaMessage = {
      type: 'ai_activity',
      accountId: accountId,
      action: action,
      details: details,
      activityId: activityId,
      timestamp: new Date().toISOString()
    };

    const topicMessageTransaction = new TopicMessageSubmitTransaction()
      .setTopicId(hederaService.genomicTopicId)
      .setMessage(JSON.stringify(hederaMessage))
      .freezeWith(hederaService.client);

    const response = await topicMessageTransaction.execute(hederaService.client);
    const receipt = await response.getReceipt(hederaService.client);
    
    return response.transactionId.toString();
  } catch (error) {
    console.error('❌ Failed to log AI activity to Hedera:', error);
    return null;
  }
};

// Helper function to log AI activity and award incentives
const logAIActivity = async (accountId, action, details, incentiveAmount = 0) => {
  try {
    const activityId = uuidv4();
    
    // Log to Hedera first
    const hederaTransactionId = await logAIToHedera(accountId, action, details, activityId);
    
    const activity = new Activity({
      activityId,
      userId: accountId,
      activityName: `ai_${action}`,
      activityDescription: details,
      activityType: 'ai',
      metadata: {
        action: action,
        timestamp: new Date().toISOString(),
        hederaTransactionId: hederaTransactionId
      },
      transactionId: hederaTransactionId || `ai_${activityId}`
    });
    await activity.save();

    // Award incentive if amount > 0
    let incentiveResult = null;
    if (incentiveAmount > 0) {
      try {
        incentiveResult = await hederaService.incentiveService.mintAndTransferIncentive(
          accountId,
          `AI ${action}`,
          activityId
        );
        
        // Log incentive activity
        if (incentiveResult.success) {
          const incentiveActivity = new Activity({
            activityId: uuidv4(),
            userId: accountId,
            activityName: 'incentive_awarded',
            activityDescription: `Earned ${incentiveResult.amount} RDZ tokens for AI ${action}`,
            activityType: 'incentive',
            metadata: {
              incentiveResult: {
                success: incentiveResult.success,
                amount: incentiveResult.amount,
                action: incentiveResult.action,
                transactionId: incentiveResult.transactionId,
                tokenId: incentiveResult.tokenId,
                requiresAssociation: incentiveResult.requiresAssociation
              },
              relatedActivityId: activityId
            },
            transactionId: incentiveResult.transactionId || `incentive_${uuidv4()}`
          });
          await incentiveActivity.save();
        }
      } catch (incentiveError) {
        console.error('❌ Failed to award AI incentive:', incentiveError);
        incentiveResult = {
          success: false,
          error: incentiveError.message
        };
      }
    }

    return { activityId, incentiveResult };
  } catch (error) {
    console.error('❌ Failed to log AI activity:', error);
    return { activityId: null, incentiveResult: null };
  }
};

// POST /api/ai/translate-fhir - Convert genomic data to FHIR format
router.post('/translate-fhir', async (req, res) => {
  try {
    const { genomicData, accountId } = req.body;

    if (!genomicData) {
      return res.status(400).json({ error: 'Genomic data is required' });
    }

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required for activity tracking' });
    }

    const result = await chatgptService.translateToFHIR(genomicData);

    if (result.success) {
      // Log FHIR translation activity and award incentive (50 RDZ tokens)
      const { incentiveResult } = await logAIActivity(
        accountId,
        'fhir_translation_completed',
        'Successfully converted genomic data to FHIR R4 bundle format',
        50
      );

      res.json({
        success: true,
        fhirData: result.fhirData,
        rawResponse: result.rawResponse,
        parseError: result.parseError,
        incentive: incentiveResult
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in FHIR translation route:', error);
    res.status(500).json({ error: 'Failed to translate to FHIR format' });
  }
});

// POST /api/ai/chat - Chat with AI about genomic data
router.post('/chat', async (req, res) => {
  try {
    const { question, genomicData, chatHistory = [], accountId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required for activity tracking' });
    }

    const result = await chatgptService.chatWithGenomicData(question, genomicData, chatHistory);

    if (result.success) {
      // Log AI chat activity and award incentive (10 RDZ tokens)
      const { incentiveResult } = await logAIActivity(
        accountId,
        'chat_started',
        `Started AI conversation: "${question.substring(0, 100)}${question.length > 100 ? '...' : ''}"`,
        10
      );

      res.json({
        success: true,
        response: result.response,
        usage: result.usage,
        incentive: incentiveResult
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in AI chat route:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// POST /api/ai/chat-enhanced - Enhanced chat with research data
router.post('/chat-enhanced', async (req, res) => {
  try {
    const { question, genomicData, chatHistory = [], accountId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required for activity tracking' });
    }

    console.log('🧬 Starting enhanced chat request for account:', accountId);

    const result = await chatgptService.chatWithResearchData(question, genomicData, chatHistory);

    if (result.success) {
      // Log enhanced AI chat activity and award higher incentive (25 RDZ tokens)
      const { incentiveResult } = await logAIActivity(
        accountId,
        'enhanced_chat_started',
        `Started enhanced AI conversation with research data: "${question.substring(0, 100)}${question.length > 100 ? '...' : ''}"`,
        25
      );

      res.json({
        success: true,
        response: result.response,
        usage: result.usage,
        researchData: result.researchData,
        incentive: incentiveResult
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in enhanced AI chat route:', error);
    res.status(500).json({ error: 'Failed to process enhanced chat request' });
  }
});

// POST /api/ai/generate-insights - Generate comprehensive genomic insights
router.post('/generate-insights', async (req, res) => {
  try {
    const { genomicData, accountId } = req.body;

    if (!genomicData) {
      return res.status(400).json({ error: 'Genomic data is required' });
    }

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required for activity tracking' });
    }

    const result = await chatgptService.generateGenomicInsights(genomicData);

    if (result.success) {
      // Log genomic insights activity and award incentive (25 RDZ tokens)
      const { incentiveResult } = await logAIActivity(
        accountId,
        'genomic_insights_completed',
        'Successfully generated comprehensive AI insights from genomic data',
        25
      );

      res.json({
        success: true,
        insights: result.insights,
        usage: result.usage,
        incentive: incentiveResult
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in insights generation route:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// POST /api/ai/clinvar-insights - Generate ClinVar-enhanced insights
router.post('/clinvar-insights', async (req, res) => {
  try {
    const { genomicData, accountId } = req.body;

    if (!genomicData) {
      return res.status(400).json({ error: 'Genomic data is required' });
    }

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required for activity tracking' });
    }

    console.log('🧬 Starting ClinVar-enhanced insights generation for account:', accountId);

    const result = await chatgptService.generateClinVarInsights(genomicData);

    if (result.success) {
      // Log ClinVar insights activity and award higher incentive (75 RDZ tokens)
      const { incentiveResult } = await logAIActivity(
        accountId,
        'clinvar_insights_completed',
        `Successfully generated ClinVar-enhanced insights with ${result.clinvarResults.length} variants analyzed`,
        75
      );

            res.json({
              success: true,
              insights: result.insights,
              clinvarResults: result.clinvarResults,
              insightsSummary: result.insightsSummary,
              africanPopulationData: result.africanPopulationData,
              researchArticles: result.researchArticles || [],
              usage: result.usage,
              incentive: incentiveResult
            });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        clinvarResults: result.clinvarResults || [],
        insightsSummary: result.insightsSummary || null
      });
    }
  } catch (error) {
    console.error('Error in ClinVar insights generation route:', error);
    res.status(500).json({ error: 'Failed to generate ClinVar-enhanced insights' });
  }
});

// GET /api/ai/clinvar/variant/:variantId - Get specific ClinVar variant information
router.get('/clinvar/variant/:variantId', async (req, res) => {
  try {
    const { variantId } = req.params;
    const { accountId } = req.query;

    if (!variantId) {
      return res.status(400).json({ error: 'Variant ID is required' });
    }

    console.log(`🔍 Fetching ClinVar variant: ${variantId}`);

    // Search for the specific variant
    const variants = await clinvarService.searchVariants(variantId, 1);
    
    if (variants.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Variant not found in ClinVar database' 
      });
    }

    const variant = variants[0];

    // Log variant lookup activity (no incentive for simple lookups)
    if (accountId) {
      await logAIActivity(
        accountId,
        'clinvar_variant_lookup',
        `Looked up ClinVar variant: ${variantId}`,
        0
      );
    }

    res.json({
      success: true,
      variant: variant
    });

  } catch (error) {
    console.error('Error in ClinVar variant lookup route:', error);
    res.status(500).json({ error: 'Failed to fetch ClinVar variant information' });
  }
});

// GET /api/ai/clinvar/search - Search ClinVar database
router.get('/clinvar/search', async (req, res) => {
  try {
    const { query, maxResults = 10 } = req.query;
    const { accountId } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log(`🔍 Searching ClinVar database for: ${query}`);

    const variants = await clinvarService.searchVariants(query, parseInt(maxResults));

    // Log search activity (no incentive for searches)
    if (accountId) {
      await logAIActivity(
        accountId,
        'clinvar_search',
        `Searched ClinVar database for: ${query}`,
        0
      );
    }

    res.json({
      success: true,
      query: query,
      results: variants,
      totalResults: variants.length
    });

  } catch (error) {
    console.error('Error in ClinVar search route:', error);
    res.status(500).json({ error: 'Failed to search ClinVar database' });
  }
});

module.exports = router;