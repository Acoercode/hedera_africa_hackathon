# 🧬 RDZ Health - Genomic Data Management Platform

A comprehensive genomic data management platform built on **Hedera Hashgraph** that empowers patients to own, control, and monetize their genomic data while enabling secure research collaboration.

## 🌟 **Overview**

RDZ Health is a patient-centric genomic data platform that leverages Hedera Hashgraph DLT technology to ensure data ownership, consent management, and transparent incentive distribution. Built for the **Hedera Africa Hackathon**, this platform addresses critical challenges in genomic data privacy, ownership, and research collaboration.

### **Key Features**
- 🔐 **Patient Data Ownership** - True ownership through Hedera Hashgraph HTS NFTs
- 🎫 **Consent Management** - Immutable consent records with expiration
- 💰 **Incentive System** - RDZ tokens for data sharing and participation
- 🤖 **AI-Powered Insights** - ChatGPT integration for genomic analysis
- 📊 **Activity Tracking** - Complete audit trail on Hedera
- 🏥 **FHIR Compliance** - Healthcare interoperability standards

## 🏗️ **Architecture**

### **Frontend (React + TypeScript)**
- **Material-UI** for modern, responsive design
- **Hedera Wallet Connect** for Hedera Hashgraph integration
- **Real-time** activity tracking and notifications
- **Multi-tab interface** with patient profile, data sharing, AI tools, and wallet

### **Backend (Node.js + Express)**
- **MongoDB** for patient and genomic data storage
- **Hedera SDK** for Hedera Hashgraph DLT operations
- **RESTful API** with comprehensive endpoints
- **Security** with Helmet, CORS, and rate limiting

### **DLT Integration (Hedera Hashgraph)**
- **Hedera Consensus Service (HCS)** for immutable logging
- **Hedera Token Service (HTS)** for NFT and token management
- **Smart contracts** for automated incentive distribution

## 🚀 **Core Functionality**

### **1. Patient Profile Management**
- **Account Lookup** - iHope ID verification system
- **Genomic Data Display** - Comprehensive health profile
- **Wallet Integration** - Hedera account management
- **Data Sync Consent** - Platform participation agreement

### **2. Consent Management System**
- **Data Synchronization Consent** - Platform data sharing
- **Research Participation** - Medical research consent
- **RDZ Passport Creation** - Genomic data ownership proof
- **NFT-Based Consent** - Immutable consent records

### **3. AI-Powered Features**
- **Chat Assistant** - Genomic data Q&A with ChatGPT
- **FHIR Translation** - Convert genomic data to FHIR R4 format
- **Genomic Insights** - AI-generated health recommendations
- **Activity Tracking** - All AI interactions logged on Hedera

### **4. Incentive & Reward System**
- **RDZ Token Distribution** - Automated reward system
- **Activity-Based Rewards**:
  - Data sync consent: 100 RDZ tokens
  - Research consent: 150 RDZ tokens
  - Passport creation: 200 RDZ tokens
  - AI chat started: 10 RDZ tokens
  - FHIR translation: 50 RDZ tokens
  - Genomic insights: 25 RDZ tokens

### **5. Activity & Audit Trail**
- **Complete Activity Log** - All user actions tracked
- **Hedera Integration** - Immutable DLT records on the ledger
- **Filtered Views** - Consent, Data, Incentives, AI activities
- **Real-time Updates** - Live activity monitoring

## 🔗 **Hedera Hashgraph Integration**

### **Hedera Consensus Service (HCS)**
- **Immutable Logging** - All activities recorded on Hedera
- **Consent Hashes** - Anonymized consent records
- **Data Access Logs** - Research access tracking
- **AI Activity Logs** - ChatGPT interactions recorded

### **Hedera Token Service (HTS)**
- **Consent NFTs** - Patient-owned consent tokens
- **Passport NFTs** - Genomic data ownership proof
- **RDZ Incentive Tokens** - Fungible reward tokens
- **Token Association** - Automatic wallet setup

### **Key Hedera Features Used**
```javascript
// Consensus Service for immutable logging
TopicMessageSubmitTransaction
  .setTopicId(consentTopicId)
  .setMessage(consentData)

// Token Service for NFT creation
TokenCreateTransaction
  .setTokenType(TokenType.NonFungibleUnique)
  .setTokenName("RDZ Consent NFT")

// Transfer transactions for incentives
TransferTransaction
  .addTokenTransfer(tokenId, operatorId, -amount)
  .addTokenTransfer(tokenId, patientId, amount)
```

## 🛠️ **Technology Stack**

### **Frontend**
- **React 18** with TypeScript
- **Material-UI (MUI)** for components
- **Hedera Wallet Connect** for DLT integration
- **Axios** for API communication

### **Backend**
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Hedera SDK** for DLT operations
- **ChatGPT API** for AI features

### **DLT**
- **Hedera Hashgraph** testnet
- **Hedera Consensus Service** for logging
- **Hedera Token Service** for NFTs and tokens
- **Wallet Connect** for user authentication

## 📱 **User Interface**

### **Main Navigation Tabs**
1. **Profile** - Patient overview and genomic data
2. **Data** - Consent management and data sharing
3. **Activity** - Complete activity history and audit trail
4. **AI** - ChatGPT-powered genomic insights
5. **Wallet** - Token balance and NFT management

### **AI Features Interface**
- **Chat Assistant** - Interactive genomic Q&A
- **FHIR Translation** - Convert data to healthcare standards
- **Genomic Insights** - AI-generated health recommendations

## 🔧 **Installation & Setup**

### **Prerequisites**
- Node.js 18+
- MongoDB
- Hedera testnet account
- OpenAI API key (for AI features)

### **Environment Variables**
```bash
# Hedera Configuration
HEDERA_OPERATOR_ID=0.0.xxxxxx
HEDERA_OPERATOR_KEY=your_private_key
HEDERA_NETWORK=testnet

# Token IDs (created via setup scripts)
HEDERA_CONSENT_TOPIC_ID=0.0.xxxxxx
HEDERA_GENOMIC_TOPIC_ID=0.0.xxxxxx
HEDERA_RESEARCH_CONSENT_NFT_TOKEN_ID=0.0.xxxxxx
HEDERA_PASSPORT_NFT_TOKEN_ID=0.0.xxxxxx
HEDERA_DATA_SYNC_NFT_TOKEN_ID=0.0.xxxxxx
HEDERA_RDZ_INCENTIVE_TOKEN_ID=0.0.xxxxxx

# AI Services
OPENAI_API_KEY=your_openai_api_key

# Database
MONGODB_URI=mongodb://localhost:27017/rdz_health
```

### **Quick Start**
```bash
# Clone repository
git clone <repository-url>
cd hedera_africa_hackathon

# Install dependencies
npm run install-all

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development servers
npm run dev
```

### **Production Deployment**
```bash
# Build for production
npm run build-all

# Start production server
cd server && npm start
```

## 🔐 **Security Features**

### **Data Privacy**
- **No PII on Ledger** - Only anonymized hashes stored
- **Encrypted Storage** - Sensitive data encrypted in MongoDB
- **Consent-Based Access** - NFT ownership controls data access
- **Audit Trail** - Complete activity logging

### **DLT Security**
- **Immutable Records** - Hedera Consensus Service
- **NFT Ownership** - Cryptographic proof of consent
- **Token Economics** - Transparent incentive distribution
- **Wallet Integration** - Secure user authentication

## 📊 **API Endpoints**

### **Consent Management**
- `POST /api/consent` - Create consent with NFT
- `GET /api/consent` - Get user consents
- `POST /api/consent/:id/revoke` - Revoke consent
- `POST /api/consent/verify-nft` - Verify consent NFT

### **AI Features**
- `POST /api/ai/chat` - ChatGPT conversation
- `POST /api/ai/translate-fhir` - FHIR translation
- `POST /api/ai/generate-insights` - Genomic insights

### **Incentives**
- `GET /api/incentives/balance/:accountId` - Token balance
- `GET /api/incentives/association-info/:accountId` - Association status

### **Activities**
- `GET /api/activities/user/:accountId` - User activities
- `POST /api/activities/create` - Log activity

## 🎯 **Use Cases**

### **For Patients**
- **Own Your Data** - True ownership through Hedera Hashgraph HTS NFTs
- **Control Access** - Grant/revoke consent with expiration
- **Earn Rewards** - Receive RDZ tokens for participation
- **Get Insights** - AI-powered genomic analysis

### **For Researchers**
- **Verify Consent** - NFT-based consent verification
- **Access Data** - Secure, consent-based data access
- **Track Usage** - Complete audit trail on ledger
- **Incentivize Participation** - Transparent reward system

### **For Healthcare Providers**
- **FHIR Compliance** - Standardized data formats
- **Interoperability** - Seamless data exchange
- **Patient Engagement** - AI-powered health insights
- **Regulatory Compliance** - Immutable consent records

## 🌍 **Impact & Benefits**

### **Patient Empowerment**
- **Data Ownership** - Patients truly own their genomic data
- **Consent Control** - Granular control over data sharing
- **Financial Incentives** - Earn rewards for data contribution
- **Health Insights** - AI-powered personalized recommendations

### **Research Advancement**
- **Consent Verification** - DLT-verified consent
- **Data Quality** - Incentivized high-quality data sharing
- **Audit Trail** - Complete research data provenance
- **Global Collaboration** - Decentralized research platform

### **Healthcare Innovation**
- **Interoperability** - FHIR-compliant data exchange
- **AI Integration** - Advanced genomic analysis tools
- **Regulatory Compliance** - Immutable consent records
- **Cost Reduction** - Streamlined data management

## 🚀 **Future Roadmap**

### **Phase 1** ✅ (Current)
- Basic consent management
- NFT-based data ownership
- AI-powered insights
- Incentive system

### **Phase 2** 🔄 (Planned)
- Advanced AI models
- Multi-chain support
- Research marketplace
- Mobile application

### **Phase 3** 🔮 (Vision)
- Global genomic network
- Real-time health monitoring
- Personalized medicine
- Decentralized research DAO

## 🤝 **Contributing**

We welcome contributions to improve the platform:

1. **Fork** the repository
2. **Create** a feature branch
3. **Commit** your changes
4. **Push** to the branch
5. **Open** a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Hedera Hashgraph** for DLT infrastructure
- **OpenAI** for AI capabilities
- **Material-UI** for UI components
- **Hedera Africa Hackathon** for the platform

## 📞 **Contact**

For questions, support, or collaboration opportunities:

- **Email**: [your-email@domain.com]
- **GitHub**: [your-github-username]
- **LinkedIn**: [your-linkedin-profile]

---

**Built with ❤️ for the Hedera Africa Hackathon**

*Empowering patients, advancing research, transforming healthcare through DLT technology.*