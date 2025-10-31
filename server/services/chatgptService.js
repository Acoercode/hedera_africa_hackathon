const axios = require('axios');
const clinvarService = require('./clinvarService');
const pubmedService = require('./pubmedService');

class ChatGPTService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.model = 'gpt-4';
    this.clinvarService = clinvarService;
    this.pubmedService = pubmedService;
  }

  async translateToFHIR(genomicData) {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const prompt = `
You are a medical data specialist. Convert the following genomic data to FHIR R4 format as a complete FHIR Bundle.

Genomic Data:
${JSON.stringify(genomicData, null, 2)}

Please create a complete FHIR Bundle that includes:
1. A FHIR Patient resource
2. FHIR Observation resources for genomic findings
3. A FHIR DiagnosticReport resource
4. Any relevant FHIR Procedure resources
5. A FHIR Specimen resource if applicable

Return the response as a complete FHIR Bundle JSON with the following structure:
{
  "resourceType": "Bundle",
  "id": "genomic-bundle-[timestamp]",
  "type": "collection",
  "timestamp": "[current-timestamp]",
  "entry": [
    {
      "resource": { /* FHIR Patient resource */ }
    },
    {
      "resource": { /* FHIR Observation resource for genomic findings */ }
    },
    {
      "resource": { /* FHIR DiagnosticReport resource */ }
    }
    // Add more entries as needed
  ]
}

Also provide a separate summary object:
{
  "summary": "Brief summary of the FHIR conversion and what resources were created"
}

Ensure all resources follow FHIR R4 standards, include proper coding systems for genomic data (LOINC, SNOMED CT), and use appropriate resource IDs and references.
`;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a medical data specialist expert in FHIR R4 standards and genomic data conversion.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      
      // Try to parse the JSON response
      try {
        // Look for JSON objects in the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const fhirData = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            fhirData,
            rawResponse: content,
            isBundle: fhirData.resourceType === 'Bundle'
          };
        } else {
          return {
            success: true,
            fhirData: null,
            rawResponse: content,
            parseError: 'No JSON object found in response'
          };
        }
      } catch (parseError) {
        // If JSON parsing fails, return the raw response
        return {
          success: true,
          fhirData: null,
          rawResponse: content,
          parseError: 'Could not parse JSON response'
        };
      }

    } catch (error) {
      console.error('Error in FHIR translation:', error);
      return {
        success: false,
        error: error.message,
        fhirData: null
      };
    }
  }

  async chatWithGenomicData(question, genomicData, chatHistory = []) {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      // Build context from genomic data
      const genomicContext = this.buildGenomicContext(genomicData);
      
      const messages = [
        {
          role: 'system',
          content: `You are a medical AI assistant specializing in genomic data interpretation. You help patients understand their genetic test results, potential health implications, and answer questions about their genomic data.

IMPORTANT GUIDELINES:
- Always remind users that you are an AI assistant and not a substitute for professional medical advice
- Encourage users to consult with healthcare providers for medical decisions
- Be clear about the limitations of genomic data interpretation
- Use simple, understandable language
- Be supportive and empathetic
- If asked about specific medical conditions, provide general information but emphasize the need for professional consultation

Genomic Data Context:
${genomicContext}`
        }
      ];

      // Add chat history
      chatHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });

      // Add current question
      messages.push({
        role: 'user',
        content: question
      });

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          max_tokens: 2000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        response: response.data.choices[0].message.content,
        usage: response.data.usage
      };

    } catch (error) {
      console.error('Error in ChatGPT conversation:', error);
      return {
        success: false,
        error: error.message,
        response: null
      };
    }
  }

  async chatWithResearchData(question, genomicData, chatHistory = []) {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      console.log('🧬 Starting enhanced chat with research data...');

      // Get ClinVar and PubMed data for enhanced context
      let clinvarResults = [];
      let insightsSummary = null;
      let africanPopulationData = [];
      let researchArticles = [];

      try {
        // Query ClinVar for variants
        clinvarResults = await this.clinvarService.queryVariants(genomicData);
        console.log(`📊 Found ${clinvarResults.length} ClinVar results for chat`);

        // Generate insights summary with existing diagnosis context
        const existingDiagnosis = genomicData.condition || genomicData.findings || null;
        insightsSummary = this.clinvarService.generateInsightsSummary(clinvarResults, existingDiagnosis);
        
        // Get African population data
        africanPopulationData = await this.clinvarService.getAfricanPopulationData(
          insightsSummary.diseaseAssociations.map(name => ({ name }))
        );

        // Search for relevant research articles
        researchArticles = await this.pubmedService.searchRelevantArticles(genomicData, clinvarResults);
        console.log(`📚 Found ${researchArticles.length} relevant research articles for chat`);
      } catch (researchError) {
        console.error('⚠️ Error fetching research data for chat:', researchError);
        // Continue with basic genomic data if research data fails
      }

      // Build comprehensive context
      const genomicContext = this.buildGenomicContext(genomicData);
      const clinvarContext = this.buildClinVarContext(clinvarResults, insightsSummary, africanPopulationData);
      const pubmedContext = this.buildPubMedContext(researchArticles);
      
      const messages = [
        {
          role: 'system',
          content: `You are a medical AI assistant specializing in genomic data interpretation with access to ClinVar clinical evidence and the latest research from PubMed. You help patients understand their genetic test results, potential health implications, and answer questions about their genomic data.

IMPORTANT GUIDELINES:
- Always remind users that you are an AI assistant and not a substitute for professional medical advice
- Encourage users to consult with healthcare providers for medical decisions
- Be clear about the limitations of genomic data interpretation
- Use simple, understandable language
- Be supportive and empathetic
- When possible, reference specific research studies and clinical evidence
- Provide evidence-based information from the latest research
- If asked about specific medical conditions, provide current research-backed information but emphasize the need for professional consultation

AVAILABLE DATA:
${genomicContext}

${clinvarContext}

${pubmedContext}

When answering questions, prioritize:
1. Evidence from ClinVar clinical database
2. Latest research findings from PubMed
3. African population-specific considerations
4. Current treatment approaches and clinical trials
5. General medical knowledge as fallback`
        }
      ];

      // Add chat history
      chatHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });

      // Add current question
      messages.push({
        role: 'user',
        content: question
      });

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          max_tokens: 3000, // Increased for more comprehensive responses
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        response: response.data.choices[0].message.content,
        usage: response.data.usage,
        researchData: {
          clinvarResults: clinvarResults,
          insightsSummary: insightsSummary,
          africanPopulationData: africanPopulationData,
          researchArticles: researchArticles
        }
      };

    } catch (error) {
      console.error('Error in enhanced ChatGPT conversation:', error);
      return {
        success: false,
        error: error.message,
        response: null
      };
    }
  }

  buildGenomicContext(genomicData) {
    if (!genomicData) {
      return 'No genomic data available.';
    }

    let context = 'Available Genomic Data:\n';
    
    // Handle single GenomicData object
    context += `\nPatient Information:\n`;
    context += `- Name: ${genomicData.name} ${genomicData.surname}\n`;
    context += `- Date of Birth: ${genomicData.dob}\n`;
    context += `- Sex: ${genomicData.sex}\n`;
    context += `- Ethnicity: ${genomicData.ethnicity}\n`;
    context += `- Clinical Status: ${genomicData.clinicalStatus}\n`;
    
    if (genomicData.findings) {
      context += `- Key Findings: ${genomicData.findings}\n`;
    }
    
    if (genomicData.condition) {
      context += `- Condition: ${genomicData.condition}\n`;
    }
    
    if (genomicData.resultForGeneticDisorder) {
      context += `- Genetic Disorder Result: ${genomicData.resultForGeneticDisorder}\n`;
    }
    
    if (genomicData.interpretation) {
      context += `- Interpretation: ${genomicData.interpretation}\n`;
    }
    
    if (genomicData.medicalHistory) {
      context += `- Medical History: ${genomicData.medicalHistory}\n`;
    }

    return context;
  }

  async generateGenomicInsights(genomicData) {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const genomicContext = this.buildGenomicContext(genomicData);

      const prompt = `
Based on the following genomic data, provide comprehensive insights including:

1. Key genetic findings and their implications
2. Potential health risks or conditions to monitor
3. Lifestyle recommendations based on genetic profile
4. Questions the patient should ask their healthcare provider
5. Any red flags that require immediate medical attention

Genomic Data:
${genomicContext}

Please provide a structured response with clear sections and actionable insights.
`;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a medical AI assistant specializing in genomic data interpretation. Provide comprehensive, evidence-based insights while emphasizing the need for professional medical consultation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 3000,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        insights: response.data.choices[0].message.content,
        usage: response.data.usage
      };

    } catch (error) {
      console.error('Error generating genomic insights:', error);
      return {
        success: false,
        error: error.message,
        insights: null
      };
    }
  }

  async generateClinVarInsights(genomicData) {
    let clinvarResults = [];
    let insightsSummary = null;
    let africanPopulationData = [];
    let researchArticles = [];
    
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      console.log('🧬 Starting ClinVar-enhanced insights generation...');

      // Query ClinVar for variants
      clinvarResults = await this.clinvarService.queryVariants(genomicData);
      console.log(`📊 Found ${clinvarResults.length} ClinVar results`);

      // Generate insights summary with existing diagnosis context
      const existingDiagnosis = genomicData.condition || genomicData.findings || null;
      insightsSummary = this.clinvarService.generateInsightsSummary(clinvarResults, existingDiagnosis);
      
      // Get African population data
      africanPopulationData = await this.clinvarService.getAfricanPopulationData(
        insightsSummary.diseaseAssociations.map(name => ({ name }))
      );

      // Search for relevant research articles
      researchArticles = await this.pubmedService.searchRelevantArticles(genomicData, clinvarResults);
      console.log(`📚 Found ${researchArticles.length} relevant research articles`);

      const genomicContext = this.buildGenomicContext(genomicData);
      const clinvarContext = this.buildClinVarContext(clinvarResults, insightsSummary, africanPopulationData);
      const pubmedContext = this.buildPubMedContext(researchArticles);

      const prompt = `
You are a medical AI assistant specializing in genomic data interpretation with access to ClinVar clinical evidence and the latest research from PubMed.

Analyze the following genomic data combined with ClinVar clinical evidence and latest research findings to provide comprehensive insights:

GENOMIC DATA:
${genomicContext}

CLINVAR CLINICAL EVIDENCE:
${clinvarContext}

${pubmedContext}

IMPORTANT CONTEXT: ${existingDiagnosis ? `The patient has an existing diagnosis of "${existingDiagnosis}". Focus on how the genetic findings relate to their known condition rather than suggesting they might have this condition.` : 'No existing diagnosis provided - provide standard genetic risk assessment.'}

Please provide a structured response with the following sections:

1. **Clinical Significance Summary**
   - Overview of pathogenic, likely pathogenic, and VUS variants found
   - How these findings relate to ${existingDiagnosis ? 'your existing diagnosis' : 'potential health risks'}
   - Priority level for medical follow-up

2. **Disease Associations & Risk Assessment**
   - ${existingDiagnosis ? 'How genetic variants confirm or modify your existing diagnosis' : 'Specific diseases associated with identified variants'}
   - Risk levels based on clinical evidence
   - African population-specific considerations

3. **Evidence-Based Recommendations**
   - ${existingDiagnosis ? 'Treatment and monitoring recommendations for your known condition' : 'Immediate actions based on pathogenic variants'}
   - Latest research findings and their clinical implications
   - Lifestyle modifications based on current evidence
   - Monitoring recommendations from recent studies
   - Family planning considerations

4. **Latest Research Insights**
   - Recent studies relevant to the genetic findings
   - Emerging treatment options and clinical trials
   - Novel therapeutic approaches from current research
   - Research gaps and areas needing more investigation

5. **African Population Context**
   - Disease prevalence in African populations
   - Population-specific genetic factors
   - Local healthcare considerations
   - Research conducted in African populations

6. **Next Steps**
   - Specific questions for healthcare providers
   - Recommended genetic counseling
   - Follow-up testing suggestions
   - Clinical trial opportunities

7. **Important Disclaimers**
   - Limitations of genomic testing
   - Need for professional medical consultation
   - Importance of family history
   - Research limitations and evolving evidence

Focus on actionable insights based on clinical evidence and latest research, with special attention to diseases prevalent in African populations. ${existingDiagnosis ? 'Emphasize how genetic findings and recent research can inform treatment and monitoring of the existing condition.' : 'Provide comprehensive risk assessment for undiagnosed individuals based on current evidence.'}
`;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a medical AI assistant specializing in genomic data interpretation with access to ClinVar clinical evidence. Provide evidence-based, clinically relevant insights while emphasizing the need for professional medical consultation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        insights: response.data.choices[0].message.content,
        clinvarResults: clinvarResults,
        insightsSummary: insightsSummary,
        africanPopulationData: africanPopulationData,
        researchArticles: researchArticles,
        usage: response.data.usage
      };

    } catch (error) {
      console.error('Error generating ClinVar-enhanced insights:', error);
      
      // Even if AI generation fails, return ClinVar data if available
      if (clinvarResults && clinvarResults.length > 0) {
        console.log('⚠️ AI generation failed, but returning ClinVar data');
        return {
          success: true,
          insights: this.generateFallbackInsights(clinvarResults, insightsSummary, africanPopulationData, researchArticles),
          clinvarResults: clinvarResults,
          insightsSummary: insightsSummary,
          africanPopulationData: africanPopulationData,
          researchArticles: researchArticles || [],
          usage: null,
          aiGenerationFailed: true
        };
      }
      
      return {
        success: false,
        error: error.message,
        insights: null,
        clinvarResults: [],
        insightsSummary: null
      };
    }
  }

  buildClinVarContext(clinvarResults, insightsSummary, africanPopulationData) {
    let context = 'ClinVar Clinical Evidence:\n\n';
    
    if (clinvarResults.length === 0) {
      context += 'No ClinVar variants found for this genomic profile.\n';
      return context;
    }

    context += `Summary: ${insightsSummary.totalVariants} variants analyzed\n`;
    context += `- Pathogenic: ${insightsSummary.pathogenicVariants}\n`;
    context += `- Likely Pathogenic: ${insightsSummary.likelyPathogenicVariants}\n`;
    context += `- Uncertain Significance: ${insightsSummary.vusVariants}\n`;
    context += `- Benign: ${insightsSummary.benignVariants}\n`;
    context += `- Expert Panel Reviewed: ${insightsSummary.expertPanelReviewed}\n\n`;

    context += 'Detailed Variant Information:\n';
    clinvarResults.forEach((result, index) => {
      context += `${index + 1}. ${result.variantName} (${result.geneSymbol})\n`;
      context += `   - Clinical Significance: ${result.clinicalSignificance}\n`;
      context += `   - Review Status: ${result.reviewStatus}\n`;
      context += `   - Evidence Level: ${result.evidenceLevel}\n`;
      context += `   - Disease: ${result.diseaseName}\n`;
      if (result.omimId) {
        context += `   - OMIM ID: ${result.omimId}\n`;
      }
      context += '\n';
    });

    if (insightsSummary.diseaseAssociations.length > 0) {
      context += 'Disease Associations:\n';
      insightsSummary.diseaseAssociations.forEach(disease => {
        context += `- ${disease}\n`;
      });
      context += '\n';
    }

    if (africanPopulationData.length > 0) {
      context += 'African Population Data:\n';
      africanPopulationData.forEach(data => {
        context += `- ${data.disease}: ${data.prevalence}% prevalence in ${data.countries.join(', ')}\n`;
        context += `  Risk Factors: ${data.riskFactors.join(', ')}\n`;
        context += `  Recommendations: ${data.recommendations.join(', ')}\n`;
      });
      context += '\n';
    }

    if (insightsSummary.recommendations.length > 0) {
      context += 'Clinical Recommendations:\n';
      insightsSummary.recommendations.forEach(rec => {
        context += `- ${rec}\n`;
      });
    }

    return context;
  }

  buildPubMedContext(researchArticles) {
    let context = 'LATEST RESEARCH EVIDENCE (PubMed):\n\n';
    
    if (researchArticles.length > 0) {
      context += `Found ${researchArticles.length} relevant research articles:\n\n`;
      
      researchArticles.forEach((article, index) => {
        context += `${index + 1}. **${article.title}**\n`;
        context += `   - Authors: ${article.authors.slice(0, 3).join(', ')}${article.authors.length > 3 ? ' et al.' : ''}\n`;
        context += `   - Journal: ${article.journal} (${article.pubDate})\n`;
        context += `   - PMID: ${article.pmid}\n`;
        context += `   - Relevance: ${article.searchType} (Score: ${article.relevanceScore}/10)\n`;
        context += `   - Abstract: ${article.abstract.substring(0, 300)}...\n`;
        if (article.keywords && article.keywords.length > 0) {
          context += `   - Keywords: ${article.keywords.slice(0, 5).join(', ')}\n`;
        }
        context += `   - URL: ${article.url}\n\n`;
      });
    } else {
      context += 'No relevant research articles found in PubMed.\n\n';
    }

    return context;
  }

  generateFallbackInsights(clinvarResults, insightsSummary, africanPopulationData, researchArticles = []) {
    let insights = '## Clinical Significance Summary\n\n';
    
    if (insightsSummary.totalVariants > 0) {
      insights += `Based on ClinVar analysis, ${insightsSummary.totalVariants} genetic variants were identified:\n`;
      insights += `- **Pathogenic variants**: ${insightsSummary.pathogenicVariants}\n`;
      insights += `- **Likely pathogenic variants**: ${insightsSummary.likelyPathogenicVariants}\n`;
      insights += `- **Variants of uncertain significance (VUS)**: ${insightsSummary.vusVariants}\n`;
      insights += `- **Expert panel reviewed**: ${insightsSummary.expertPanelReviewed}\n\n`;
      
      if (insightsSummary.hasMatchingDiagnosis) {
        insights += `✅ **CONFIRMATION**: Genetic variants confirm your existing diagnosis of ${insightsSummary.existingDiagnosis}.\n\n`;
      } else if (insightsSummary.pathogenicVariants > 0) {
        insights += '⚠️ **HIGH PRIORITY**: Pathogenic variants detected requiring immediate medical attention.\n\n';
      }
    } else {
      insights += 'No specific ClinVar variants were identified in the analysis.\n\n';
    }

    insights += '## Disease Associations & Risk Assessment\n\n';
    if (insightsSummary.diseaseAssociations.length > 0) {
      insights += '**Identified disease associations:**\n';
      insightsSummary.diseaseAssociations.forEach(disease => {
        insights += `- ${disease}\n`;
      });
      insights += '\n';
    }

    insights += '## Evidence-Based Recommendations\n\n';
    if (insightsSummary.recommendations.length > 0) {
      insightsSummary.recommendations.forEach(rec => {
        insights += `- ${rec}\n`;
      });
      insights += '\n';
    }

    insights += '## Latest Research Insights\n\n';
    if (researchArticles.length > 0) {
      insights += '**Recent Research Findings:**\n';
      researchArticles.slice(0, 3).forEach((article, index) => {
        insights += `${index + 1}. **${article.title}** (${article.journal}, ${article.pubDate})\n`;
        insights += `   - Authors: ${article.authors.slice(0, 2).join(', ')}${article.authors.length > 2 ? ' et al.' : ''}\n`;
        insights += `   - Key findings: ${article.abstract.substring(0, 200)}...\n`;
        insights += `   - [Read full article](${article.url})\n\n`;
      });
    } else {
      insights += 'No recent research articles found for this condition.\n\n';
    }

    insights += '## African Population Context\n\n';
    if (africanPopulationData.length > 0) {
      africanPopulationData.forEach(data => {
        insights += `**${data.disease}**:\n`;
        insights += `- Prevalence: ${data.prevalence}% in African populations\n`;
        insights += `- Countries: ${data.countries.join(', ')}\n`;
        insights += `- Risk factors: ${data.riskFactors.join(', ')}\n`;
        insights += `- Recommendations: ${data.recommendations.join(', ')}\n\n`;
      });
    }

    insights += '## Next Steps\n\n';
    insights += '1. **Immediate consultation** with a healthcare provider specializing in genetic disorders\n';
    insights += '2. **Genetic counseling** to understand inheritance patterns and family implications\n';
    insights += '3. **Regular monitoring** for disease progression and complications\n';
    insights += '4. **Family planning considerations** if applicable\n\n';

    insights += '## Important Disclaimers\n\n';
    insights += '- This analysis is based on available ClinVar data and should not replace professional medical advice\n';
    insights += '- Individual risk may vary based on specific genetic variants and family history\n';
    insights += '- Regular follow-up with healthcare providers is essential\n';
    insights += '- Consider genetic counseling for comprehensive risk assessment\n\n';

    insights += '*Note: This analysis was generated using ClinVar database information. AI-generated insights were not available due to technical limitations.*';

    return insights;
  }
}

module.exports = new ChatGPTService();
