# 🎯 **NFT + Token Features Implementation**

## 🚀 **What We've Built**

Your hackathon project now includes **advanced blockchain features** that make it stand out:

### **1. Consent NFTs** 🎫
- **Patient-owned consent tokens** on Hedera
- **Immutable consent records** with expiration dates
- **Verifiable ownership** through blockchain
- **Metadata storage** for consent details

### **2. Genomic Data NFTs** 🧬
- **Encrypted genomic data** stored as NFT metadata
- **Patient ownership** of their genomic data
- **Access control** through NFT ownership
- **Quality metrics** and file information stored

### **3. Incentive Tokens (GDI)** 💰
- **Genomic Data Incentive (GDI) tokens** for participation
- **Automatic distribution** for various actions
- **Transparent reward system** for data sharing
- **Token economics** to encourage participation

## 🔄 **Complete Flow**

### **Step 1: Patient Registration**
```bash
POST /api/patients
{
  "patientId": "patient_001",
  "hederaAccountId": "0.0.123456",
  "walletAddress": "0x1234..."
}
```

### **Step 2: Consent Creation with NFT**
```bash
POST /api/consent
{
  "patientId": "patient_001",
  "consentType": "genomic_analysis",
  "dataTypes": ["whole_genome"],
  "purposes": ["research"],
  "patientSignature": "0x...",
  "hederaAccountId": "0.0.123456"
}
```

**What happens:**
1. ✅ Consent hash submitted to Hedera HCS
2. ✅ Consent NFT created and minted to patient
3. ✅ 100 GDI tokens distributed as incentive
4. ✅ All transactions recorded on blockchain

### **Step 3: Genomic Data Upload with NFT**
```bash
POST /api/genomic
Content-Type: multipart/form-data

genomicFile: [VCF/FASTQ file]
patientId: "patient_001"
dataType: "whole_genome"
```

**What happens:**
1. ✅ Validates consent NFT ownership
2. ✅ Encrypts genomic data
3. ✅ Creates genomic data NFT
4. ✅ Mints NFT to patient's account
5. ✅ 500 GDI tokens distributed
6. ✅ Access logged on Hedera

### **Step 4: Data Access with NFT Verification**
```bash
POST /api/genomic/:id/access
{
  "userId": "researcher_001",
  "consentNFTTokenId": "0.0.1234567",
  "consentNFTSerialNumber": "1"
}
```

**What happens:**
1. ✅ Verifies consent NFT ownership
2. ✅ Checks NFT expiration
3. ✅ Grants access if valid
4. ✅ Logs access on Hedera
5. ✅ 50 GDI tokens distributed

## 🎁 **Incentive System**

### **Token Distribution Rates:**
- **Consent Provided**: 100 GDI tokens
- **Data Uploaded**: 500 GDI tokens
- **Data Accessed**: 50 GDI tokens
- **AI Analysis Completed**: 200 GDI tokens
- **Research Participation**: 1000 GDI tokens

### **Data Type Multipliers:**
- **Whole Genome**: 1.5x multiplier
- **Exome**: 1.2x multiplier
- **RNA-seq**: 1.3x multiplier
- **Targeted Panel**: 1.0x multiplier

## 🔍 **NFT Verification**

### **Verify Consent NFT:**
```bash
POST /api/consent/verify-nft
{
  "tokenId": "0.0.1234567",
  "serialNumber": "1",
  "patientId": "0.0.123456"
}
```

### **Get Genomic Data by NFT:**
```bash
GET /api/genomic/nft/0.0.1234567/1
```

## 💡 **Key Benefits**

### **1. True Patient Ownership**
- Patients own their consent NFTs
- Patients own their genomic data NFTs
- Patients control access through NFT ownership

### **2. Transparent Incentives**
- All token distributions are on-chain
- Patients can track their earnings
- Researchers can see participation rewards

### **3. Immutable Audit Trail**
- All consent changes are recorded
- All data access is logged
- All transactions are verifiable

### **4. Interoperability**
- NFTs can be traded on marketplaces
- Tokens can be used across dApps
- Smart contracts can interact with NFTs

## 🚀 **API Endpoints**

### **Consent Management:**
- `POST /api/consent` - Create consent with NFT
- `GET /api/consent/nft/:tokenId/:serialNumber` - Get consent by NFT
- `POST /api/consent/verify-nft` - Verify consent NFT

### **Genomic Data:**
- `POST /api/genomic` - Upload data with NFT
- `GET /api/genomic/nft/:tokenId/:serialNumber` - Get data by NFT
- `PUT /api/genomic/:id/access` - Access with NFT verification

### **Incentives:**
- `GET /api/incentives/rates` - Get incentive rates
- `GET /api/incentives/balance/:accountId` - Get token balance
- `POST /api/incentives/distribute` - Manual distribution

## 🔧 **Environment Variables**

Add these to your `server/.env`:

```env
# Hedera Configuration
HEDERA_OPERATOR_ID=0.0.123456
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...
HEDERA_CONSENT_TOPIC_ID=0.0.1234567
HEDERA_GENOMIC_TOPIC_ID=0.0.1234568
```

## 🎯 **Demo Scenarios**

### **Scenario 1: Patient Onboarding**
1. Patient connects wallet → Gets Hedera account
2. Patient signs consent → Receives consent NFT + 100 GDI
3. Patient uploads genome → Receives data NFT + 500 GDI
4. Patient can verify ownership on Hedera explorer

### **Scenario 2: Researcher Access**
1. Researcher requests data access
2. System verifies patient's consent NFT
3. Access granted if NFT is valid
4. Access logged on Hedera + 50 GDI distributed

### **Scenario 3: AI Analysis**
1. AI system processes genomic data
2. Results stored with patient consent
3. Analysis logged on Hedera
4. Patient receives 200 GDI tokens

## 🌟 **What Makes This Special**

1. **Real Blockchain Integration** - Not just simulations
2. **Patient Ownership** - True non-custodial control
3. **Incentive Alignment** - Tokens encourage participation
4. **Transparent Operations** - All actions are verifiable
5. **Interoperable Assets** - NFTs and tokens work across platforms

This implementation demonstrates **real-world blockchain utility** for healthcare, making your hackathon project a standout example of **DLT for Operations** and **AI & DePIN** integration! 🚀
