const express = require('express');
const router = express.Router();
const chatgptService = require('../services/chatgptService');

// POST /api/ai/translate-fhir - Convert genomic data to FHIR format
router.post('/translate-fhir', async (req, res) => {
  try {
    const { genomicData } = req.body;

    if (!genomicData) {
      return res.status(400).json({ error: 'Genomic data is required' });
    }

    const result = await chatgptService.translateToFHIR(genomicData);

    if (result.success) {
      res.json({
        success: true,
        fhirData: result.fhirData,
        rawResponse: result.rawResponse,
        parseError: result.parseError
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
    const { question, genomicData, chatHistory = [] } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const result = await chatgptService.chatWithGenomicData(question, genomicData, chatHistory);

    if (result.success) {
      res.json({
        success: true,
        response: result.response,
        usage: result.usage
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

// POST /api/ai/generate-insights - Generate comprehensive genomic insights
router.post('/generate-insights', async (req, res) => {
  try {
    const { genomicData } = req.body;

    if (!genomicData) {
      return res.status(400).json({ error: 'Genomic data is required' });
    }

    const result = await chatgptService.generateGenomicInsights(genomicData);

    if (result.success) {
      res.json({
        success: true,
        insights: result.insights,
        usage: result.usage
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

module.exports = router;