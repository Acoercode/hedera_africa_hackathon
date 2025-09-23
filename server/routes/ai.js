const express = require('express');
const router = express.Router();
const GenomicData = require('../models/GenomicData');
const Consent = require('../models/Consent');
const User = require('../models/User');

// GET /api/ai/insights/:patientId - Get AI insights for a patient
router.get('/insights/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { analysisType } = req.query;

    // Check if patient exists
    const patient = await User.findOne({ patientId, isActive: true });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get all genomic data for the patient
    const genomicData = await GenomicData.findByPatient(patientId);
    
    if (genomicData.length === 0) {
      return res.json({
        patientId,
        insights: [],
        message: 'No genomic data available for analysis'
      });
    }

    // Collect all AI analysis results
    let allInsights = [];
    
    for (const data of genomicData) {
      if (data.aiAnalysis && data.aiAnalysis.length > 0) {
        for (const analysis of data.aiAnalysis) {
          if (!analysisType || analysis.analysisType === analysisType) {
            allInsights.push({
              dataId: data.dataId,
              dataType: data.dataType,
              analysisType: analysis.analysisType,
              model: analysis.model,
              version: analysis.version,
              results: analysis.results,
              confidence: analysis.confidence,
              timestamp: analysis.timestamp
            });
          }
        }
      }
    }

    // Sort by confidence and timestamp
    allInsights.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    res.json({
      patientId,
      totalInsights: allInsights.length,
      insights: allInsights
    });
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
});

// POST /api/ai/analyze - Run AI analysis on genomic data
router.post('/analyze', async (req, res) => {
  try {
    const { 
      dataId, 
      analysisType, 
      model, 
      version, 
      parameters = {} 
    } = req.body;

    if (!dataId || !analysisType || !model) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get genomic data
    const genomicData = await GenomicData.findOne({ 
      dataId, 
      isActive: true 
    });

    if (!genomicData) {
      return res.status(404).json({ error: 'Genomic data not found' });
    }

    // Check consent for AI analysis
    const validConsents = await Consent.findValidConsents(
      genomicData.patientId, 
      genomicData.dataType, 
      'ai_analysis'
    );

    if (validConsents.length === 0) {
      return res.status(403).json({ error: 'No valid consent for AI analysis' });
    }

    // Simulate AI analysis (in real implementation, this would call AI service)
    const analysisResults = await simulateAIAnalysis(analysisType, parameters);

    // Add AI analysis to genomic data
    await genomicData.addAIAnalysis(
      analysisType,
      model,
      version || '1.0.0',
      analysisResults.results,
      analysisResults.confidence
    );

    // Add access log
    await genomicData.addAccessLog(
      'ai_system',
      'ai_analysis',
      `AI analysis: ${analysisType}`,
      null
    );

    res.json({
      message: 'AI analysis completed successfully',
      analysisType,
      model,
      version: version || '1.0.0',
      results: analysisResults.results,
      confidence: analysisResults.confidence,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running AI analysis:', error);
    res.status(500).json({ error: 'Failed to run AI analysis' });
  }
});

// GET /api/ai/models - Get available AI models
router.get('/models', async (req, res) => {
  try {
    const models = [
      {
        id: 'disease_prediction_v1',
        name: 'Disease Risk Prediction',
        version: '1.0.0',
        description: 'Predicts risk of common genetic diseases',
        analysisType: 'disease_prediction',
        supportedDataTypes: ['whole_genome', 'exome', 'snp_array'],
        parameters: {
          population: { type: 'string', default: 'global' },
          confidence_threshold: { type: 'number', default: 0.7 }
        }
      },
      {
        id: 'drug_response_v1',
        name: 'Drug Response Prediction',
        version: '1.0.0',
        description: 'Predicts drug efficacy and adverse reactions',
        analysisType: 'drug_response',
        supportedDataTypes: ['whole_genome', 'exome', 'targeted_panel'],
        parameters: {
          drug_list: { type: 'array', default: [] },
          include_adverse_effects: { type: 'boolean', default: true }
        }
      },
      {
        id: 'ancestry_v1',
        name: 'Ancestry Analysis',
        version: '1.0.0',
        description: 'Determines genetic ancestry and population groups',
        analysisType: 'ancestry',
        supportedDataTypes: ['whole_genome', 'exome', 'snp_array'],
        parameters: {
          reference_populations: { type: 'array', default: ['global'] },
          resolution: { type: 'string', default: 'continental' }
        }
      },
      {
        id: 'traits_v1',
        name: 'Genetic Traits Analysis',
        version: '1.0.0',
        description: 'Analyzes genetic traits and characteristics',
        analysisType: 'traits',
        supportedDataTypes: ['whole_genome', 'exome', 'snp_array'],
        parameters: {
          trait_categories: { type: 'array', default: ['physical', 'behavioral'] },
          include_rare_traits: { type: 'boolean', default: false }
        }
      },
      {
        id: 'pharmacogenomics_v1',
        name: 'Pharmacogenomics Analysis',
        version: '1.0.0',
        description: 'Analyzes drug metabolism and pharmacogenomic variants',
        analysisType: 'pharmacogenomics',
        supportedDataTypes: ['whole_genome', 'exome', 'targeted_panel'],
        parameters: {
          drug_metabolism_genes: { type: 'array', default: ['CYP2D6', 'CYP2C19', 'CYP3A4'] },
          include_dosing_recommendations: { type: 'boolean', default: true }
        }
      }
    ];

    res.json({ models });
  } catch (error) {
    console.error('Error fetching AI models:', error);
    res.status(500).json({ error: 'Failed to fetch AI models' });
  }
});

// GET /api/ai/analysis-types - Get available analysis types
router.get('/analysis-types', async (req, res) => {
  try {
    const analysisTypes = [
      {
        type: 'disease_prediction',
        name: 'Disease Risk Prediction',
        description: 'Predicts genetic risk for various diseases',
        icon: 'health_and_safety'
      },
      {
        type: 'drug_response',
        name: 'Drug Response',
        description: 'Predicts drug efficacy and adverse reactions',
        icon: 'medication'
      },
      {
        type: 'ancestry',
        name: 'Ancestry Analysis',
        description: 'Determines genetic ancestry and population groups',
        icon: 'family_tree'
      },
      {
        type: 'traits',
        name: 'Genetic Traits',
        description: 'Analyzes genetic traits and characteristics',
        icon: 'psychology'
      },
      {
        type: 'pharmacogenomics',
        name: 'Pharmacogenomics',
        description: 'Analyzes drug metabolism and pharmacogenomic variants',
        icon: 'biotech'
      }
    ];

    res.json({ analysisTypes });
  } catch (error) {
    console.error('Error fetching analysis types:', error);
    res.status(500).json({ error: 'Failed to fetch analysis types' });
  }
});

// Helper function to simulate AI analysis
async function simulateAIAnalysis(analysisType, parameters) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  const mockResults = {
    disease_prediction: {
      results: {
        diseases: [
          { name: 'Type 2 Diabetes', risk: 'moderate', confidence: 0.75, population_risk: 0.12 },
          { name: 'Alzheimer\'s Disease', risk: 'low', confidence: 0.68, population_risk: 0.08 },
          { name: 'Breast Cancer', risk: 'elevated', confidence: 0.82, population_risk: 0.13 }
        ],
        summary: 'Overall genetic risk profile shows moderate risk for metabolic conditions'
      },
      confidence: 0.75
    },
    drug_response: {
      results: {
        drugs: [
          { name: 'Warfarin', response: 'normal', dose_adjustment: 'none', confidence: 0.89 },
          { name: 'Clopidogrel', response: 'reduced', dose_adjustment: 'increase_dose', confidence: 0.76 },
          { name: 'Codeine', response: 'poor', dose_adjustment: 'alternative_drug', confidence: 0.92 }
        ],
        summary: 'Genetic variants suggest normal warfarin metabolism but reduced clopidogrel efficacy'
      },
      confidence: 0.85
    },
    ancestry: {
      results: {
        populations: [
          { population: 'European', percentage: 65.2, confidence: 0.91 },
          { population: 'African', percentage: 23.8, confidence: 0.87 },
          { population: 'Asian', percentage: 11.0, confidence: 0.79 }
        ],
        summary: 'Mixed European and African ancestry with minor Asian contribution'
      },
      confidence: 0.86
    },
    traits: {
      results: {
        traits: [
          { trait: 'Eye Color', prediction: 'Brown', confidence: 0.94 },
          { trait: 'Hair Color', prediction: 'Dark Brown', confidence: 0.88 },
          { trait: 'Height', prediction: 'Above Average', confidence: 0.72 },
          { trait: 'Lactose Tolerance', prediction: 'Tolerant', confidence: 0.96 }
        ],
        summary: 'Genetic analysis suggests typical European physical characteristics'
      },
      confidence: 0.87
    },
    pharmacogenomics: {
      results: {
        genes: [
          { gene: 'CYP2D6', phenotype: 'Extensive Metabolizer', confidence: 0.92 },
          { gene: 'CYP2C19', phenotype: 'Intermediate Metabolizer', confidence: 0.85 },
          { gene: 'CYP3A4', phenotype: 'Normal Metabolizer', confidence: 0.78 }
        ],
        summary: 'Normal to intermediate drug metabolism capacity across major CYP enzymes'
      },
      confidence: 0.85
    }
  };

  return mockResults[analysisType] || {
    results: { error: 'Unknown analysis type' },
    confidence: 0.0
  };
}

module.exports = router;