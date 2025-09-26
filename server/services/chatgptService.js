const axios = require('axios');

class ChatGPTService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.model = 'gpt-4';
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
}

module.exports = new ChatGPTService();
