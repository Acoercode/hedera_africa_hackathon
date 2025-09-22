const hederaService = require('./hederaService');

class IncentiveService {
  constructor() {
    this.incentiveMap = {
      'consent_provided': 100,      // 100 GDI for consent
      'data_uploaded': 500,         // 500 GDI for data upload
      'data_accessed': 50,          // 50 GDI for each access
      'ai_analysis_completed': 200, // 200 GDI for AI analysis
      'research_participation': 1000, // 1000 GDI for research participation
      'data_quality_high': 100,     // 100 GDI for high quality data
      'consent_renewed': 75,        // 75 GDI for consent renewal
      'feedback_provided': 25       // 25 GDI for feedback
    };
  }

  async calculateIncentives(action, dataType, patientId) {
    // Base incentive amount
    let baseAmount = this.incentiveMap[action] || 0;
    
    // Adjust based on data type
    const dataTypeMultiplier = {
      'whole_genome': 1.5,
      'exome': 1.2,
      'targeted_panel': 1.0,
      'snp_array': 0.8,
      'rna_seq': 1.3,
      'methylation': 1.1
    };
    
    const multiplier = dataTypeMultiplier[dataType] || 1.0;
    const finalAmount = Math.round(baseAmount * multiplier);
    
    console.log(`💰 Calculated incentive: ${finalAmount} GDI for ${action} (${dataType})`);
    
    return finalAmount;
  }

  async distributeIncentives(patientAccountId, action, dataType, amount = null) {
    try {
      const incentiveAmount = amount || await this.calculateIncentives(action, dataType);
      
      if (incentiveAmount > 0) {
        const result = await hederaService.distributeIncentiveTokens(
          patientAccountId, 
          incentiveAmount, 
          `${action}: ${dataType}`
        );
        
        console.log(`✅ Distributed ${incentiveAmount} GDI tokens to ${patientAccountId}`);
        return result;
      }
      
      return { amount: 0, reason: 'No incentive for this action' };
    } catch (error) {
      console.error('❌ Failed to distribute incentives:', error);
      throw error;
    }
  }

  async getIncentiveHistory(patientAccountId) {
    // This would typically query Hedera for token transfer history
    // For now, return a mock response
    return {
      patientAccountId,
      totalEarned: 0,
      transactions: []
    };
  }

  async getIncentiveBalance(patientAccountId) {
    // This would typically query Hedera for token balance
    // For now, return a mock response
    return {
      patientAccountId,
      balance: 0,
      tokenId: hederaService.incentiveTokenId
    };
  }

  // Get incentive rates for display
  getIncentiveRates() {
    return {
      rates: this.incentiveMap,
      description: "Incentive tokens (GDI) are distributed for various actions to encourage data sharing and participation in genomic research."
    };
  }
}

module.exports = new IncentiveService();
