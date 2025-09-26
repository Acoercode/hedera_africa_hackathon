# Environment Variables Configuration

This document outlines the environment variables needed for the Ziva Health genomic data management application.

## Required Environment Variables

### Hedera Network Configuration
```bash
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.123456
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...
```

### Hedera Topic IDs
```bash
HEDERA_CONSENT_TOPIC_ID=0.0.123456
HEDERA_GENOMIC_TOPIC_ID=0.0.6882233
HEDERA_RESEARCH_CONSENT_TOPIC_ID=0.0.123456
HEDERA_DATA_SYNC_TOPIC_ID=0.0.123456
HEDERA_PASSPORT_TOPIC_ID=0.0.123456
```

### Hedera Token IDs
```bash
HEDERA_RDZ_INCENTIVE_TOKEN_ID=0.0.123456
HEDERA_RESEARCH_CONSENT_NFT_ID=0.0.6886067
HEDERA_PASSPORT_NFT_ID=0.0.6886170
HEDERA_DATA_SYNC_NFT_ID=0.0.123456
```

### Frontend Environment Variables (REACT_APP_ prefix)
```bash
REACT_APP_HEDERA_RESEARCH_CONSENT_NFT_ID=0.0.6886067
REACT_APP_HEDERA_PASSPORT_NFT_ID=0.0.6886170
REACT_APP_HEDERA_DATA_SYNC_NFT_ID=0.0.123456
REACT_APP_HEDERA_RDZ_INCENTIVE_TOKEN_ID=0.0.123456
REACT_APP_HEDERA_RESEARCH_CONSENT_TOPIC_ID=0.0.123456
REACT_APP_HEDERA_PASSPORT_TOPIC_ID=0.0.6882233
REACT_APP_HEDERA_DATA_SYNC_TOPIC_ID=0.0.123456
```

### Database Configuration
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

### Server Configuration
```bash
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Encryption
```bash
ENCRYPTION_KEY=your-encryption-key-here
```

### AI Services
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## Token ID Usage

- **HEDERA_RESEARCH_CONSENT_NFT_ID**: Used for consent NFTs (research participation)
- **HEDERA_PASSPORT_NFT_ID**: Used for genomic passport NFTs (data ownership proof)
- **HEDERA_DATA_SYNC_NFT_ID**: Used for data synchronization NFTs (currently ignored)
- **HEDERA_RDZ_INCENTIVE_TOKEN_ID**: Used for incentive/reward tokens

## Incentive Token Rewards

- **Data Sync Consent**: 100 RDZ tokens
- **Research Consent**: 150 RDZ tokens
- **Passport Creation**: 200 RDZ tokens
- **AI Chat Started**: 10 RDZ tokens
- **AI FHIR Translation**: 50 RDZ tokens
- **AI Genomic Insights**: 25 RDZ tokens

## Topic ID Usage

- **HEDERA_CONSENT_TOPIC_ID**: HCS topic for consent logging
- **HEDERA_GENOMIC_TOPIC_ID**: HCS topic for genomic data access logging
- **HEDERA_RESEARCH_CONSENT_TOPIC_ID**: HCS topic for research consent events
- **HEDERA_DATA_SYNC_TOPIC_ID**: HCS topic for data sync events (currently ignored)
- **HEDERA_PASSPORT_TOPIC_ID**: HCS topic for passport creation events

## Setup Instructions

1. Copy the environment variables above to your `.env` file
2. Replace the placeholder values with your actual Hedera network IDs
3. Ensure the frontend variables have the `REACT_APP_` prefix
4. Restart both the backend and frontend servers after updating environment variables

## Notes

- The DATA_SYNC topic and token are currently ignored as requested
- All token IDs should be created using the Hedera setup script
- Topic IDs are automatically created if they don't exist
- Frontend variables must have `REACT_APP_` prefix to be accessible in React
- **OPENAI_API_KEY**: Required for AI features (FHIR translation, diagnostic chatbot, genomic insights)
