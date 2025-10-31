const API_BASE_URL =
  process.env.REACT_APP_API_ROOT || "http://localhost:5000/api";

export interface Patient {
  patientId: string;
  firstName: string;
  lastName: string;
  email: string;
  hederaAccountId: string;
  walletAddress: string;
  consentStatus: string;
}

export interface Consent {
  consentId: string;
  patientId: string;
  consentType: string;
  dataTypes: string[];
  purposes: string[];
  validFrom: string;
  validUntil: string;
  consentStatus: string;
  consentNFTTokenId?: string;
  consentNFTSerialNumber?: string;
  consentNFTTransactionId?: string;
  consentHash?: string;
  revokedAt?: string;
  revocationReason?: string;
  revokedBy?: string;
  revocationTransactionId?: string;
  isActive?: boolean;
  updatedAt?: string;
  unsignedMintTransaction?: {
    tokenId: string;
    consentHash: string;
    transactionData: string;
  };
}

export interface GenomicData {
  dataId: string;
  patientId: string;
  dataType: string;
  fileName: string;
  fileHash: string;
  genomicDataNFTTokenId?: string;
  genomicDataNFTSerialNumber?: string;
  genomicDataNFTTransactionId?: string;
}

export interface NFT {
  tokenId: string;
  serialNumber: string;
  type: "consent" | "genomic" | "passport";
  name: string;
  description: string;
  transactionId: string;
  status?: string;
  validFrom?: string;
  validUntil?: string;
  revokedAt?: string;
  revocationReason?: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount?: number;
  description: string;
  timestamp: string;
  transactionId: string;
  activityType?: string;
}

export interface IncentiveBalance {
  patientAccountId: string;
  balance: number;
  tokenId: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Patient endpoints
  async createPatient(patientData: Partial<Patient>): Promise<Patient> {
    return this.request<Patient>("/patients", {
      method: "POST",
      body: JSON.stringify(patientData),
    });
  }

  async getPatient(patientId: string): Promise<Patient> {
    return this.request<Patient>(`/patients/${patientId}`);
  }

  // Consent endpoints
  async createConsent(consentData: Partial<Consent>): Promise<Consent> {
    return this.request<Consent>("/consent", {
      method: "POST",
      body: JSON.stringify(consentData),
    });
  }

  async getConsents(patientId?: string): Promise<{ consents: Consent[] }> {
    const params = patientId ? `?patientId=${patientId}` : "";
    return this.request<{ consents: Consent[] }>(`/consent${params}`);
  }

  async getConsentByNFT(
    tokenId: string,
    serialNumber: string,
  ): Promise<Consent> {
    return this.request<Consent>(`/consent/nft/${tokenId}/${serialNumber}`);
  }

  async verifyConsentNFT(
    tokenId: string,
    serialNumber: string,
    patientId: string,
  ): Promise<{
    verification: { valid: boolean; reason?: string };
    consent: Consent | null;
    message: string;
  }> {
    return this.request("/consent/verify-nft", {
      method: "POST",
      body: JSON.stringify({ tokenId, serialNumber, patientId }),
    });
  }

  // Genomic data endpoints
  async uploadGenomicData(formData: FormData): Promise<GenomicData> {
    return this.request<GenomicData>("/genomic", {
      method: "POST",
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async getGenomicData(dataId: string): Promise<GenomicData> {
    return this.request<GenomicData>(`/genomic/${dataId}`);
  }

  async getGenomicDataByNFT(
    tokenId: string,
    serialNumber: string,
  ): Promise<GenomicData> {
    return this.request<GenomicData>(`/genomic/nft/${tokenId}/${serialNumber}`);
  }

  // Incentive endpoints
  async getIncentiveBalance(accountId: string): Promise<IncentiveBalance> {
    return this.request<IncentiveBalance>(`/incentives/balance/${accountId}`);
  }

  async getIncentiveRates(): Promise<{
    rates: Record<string, number>;
    description: string;
  }> {
    return this.request("/incentives/rates");
  }

  // User lookup and verification endpoints
  async getUserByHederaAccount(hederaAccountId: string): Promise<{
    exists: boolean;
    user?: any;
  }> {
    return this.request(`/users/by-hedera-account/${hederaAccountId}`);
  }

  async searchUserByIHopeId(iHopeId: string): Promise<{
    found: boolean;
    user?: {
      iHopeId: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }> {
    return this.request(`/users/search/${iHopeId}`);
  }

  async verifyAndCreateUser(data: {
    iHopeId: string;
    dateOfBirth: string;
    hederaAccountId: string;
  }): Promise<{
    success: boolean;
    user?: any;
    message?: string;
  }> {
    return this.request("/users/verify-and-create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request("/health");
  }

  // ResearchHub search endpoints
  async searchResearchHub(
    condition: string,
    maxResults: number = 5,
    accountId?: string,
  ): Promise<{
    success: boolean;
    condition: string;
    papers: any[];
    totalResults: number;
    source: string;
  }> {
    const params = new URLSearchParams({
      condition,
      maxResults: maxResults.toString(),
    });
    if (accountId) {
      params.append("accountId", accountId);
    }
    return this.request(`/ai/research/condition?${params.toString()}`);
  }
}

export const apiService = new ApiService();
export default apiService;
