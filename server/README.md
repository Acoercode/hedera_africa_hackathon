# Genomic Data Mesh - Backend API

Backend API for the Genomic Data Mesh project built for the Hedera Africa Hackathon.

## Features

- **Patient Management**: Complete CRUD operations for patient data
- **Genomic Data Management**: Upload, store, and manage genomic data files
- **Consent Management**: Blockchain-anchored consent with Hedera HCS
- **AI Analysis**: Integration with AI models for genomic insights
- **Hedera Integration**: Real blockchain transactions for consent and audit trails
- **Security**: Data encryption, access control, and audit logging

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Hedera Hashgraph** SDK for blockchain integration
- **JWT** for authentication (future)
- **Multer** for file uploads
- **Helmet** for security headers

## API Endpoints

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `GET /api/patients/hedera/:accountId` - Get patient by Hedera account
- `GET /api/patients/wallet/:address` - Get patient by wallet address
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `PUT /api/patients/:id/consent` - Update patient consent
- `GET /api/patients/:id/access-log` - Get patient access log
- `DELETE /api/patients/:id` - Delete patient

### Genomic Data
- `GET /api/genomic` - Get all genomic data
- `GET /api/genomic/:id` - Get genomic data by ID
- `GET /api/genomic/patient/:patientId` - Get patient's genomic data
- `POST /api/genomic` - Upload genomic data file
- `PUT /api/genomic/:id/access` - Grant access to genomic data
- `POST /api/genomic/:id/ai-analysis` - Add AI analysis results
- `GET /api/genomic/:id/ai-analysis` - Get AI analysis results
- `GET /api/genomic/:id/access-log` - Get access log
- `DELETE /api/genomic/:id` - Delete genomic data

### Consent Management
- `GET /api/consent` - Get all consents
- `GET /api/consent/:id` - Get consent by ID
- `GET /api/consent/patient/:patientId` - Get patient's consents
- `GET /api/consent/transaction/:transactionId` - Get consent by transaction ID
- `POST /api/consent` - Create new consent (submits to Hedera)
- `PUT /api/consent/:id/revoke` - Revoke consent
- `PUT /api/consent/:id/access` - Grant access to authorized entity
- `GET /api/consent/:id/access-log` - Get consent access log
- `POST /api/consent/:id/access-log` - Add access log entry
- `GET /api/consent/verify/:transactionId` - Verify consent on blockchain
- `DELETE /api/consent/:id` - Delete consent

### AI Analysis
- `GET /api/ai/insights/:patientId` - Get AI insights for patient
- `POST /api/ai/analyze` - Run AI analysis on genomic data
- `GET /api/ai/models` - Get available AI models
- `GET /api/ai/analysis-types` - Get available analysis types

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the server**:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `HEDERA_OPERATOR_ID` - Hedera operator account ID
- `HEDERA_OPERATOR_KEY` - Hedera operator private key
- `HEDERA_CONSENT_TOPIC_ID` - Hedera HCS topic for consent
- `HEDERA_GENOMIC_TOPIC_ID` - Hedera HCS topic for genomic data

## Hedera Integration

The backend integrates with Hedera Hashgraph for:

- **Consent Anchoring**: Consent hashes are stored on Hedera HCS
- **Audit Trails**: Data access logs are recorded on the blockchain
- **Immutable Records**: All consent and access events are permanently recorded
- **Transparency**: Patients can verify their consent status on the blockchain

## Security Features

- **Data Encryption**: All genomic data is encrypted at rest
- **Access Control**: Role-based access to genomic data
- **Audit Logging**: All data access is logged and recorded on Hedera
- **Consent Verification**: Blockchain-verified consent status
- **Rate Limiting**: API rate limiting to prevent abuse

## Database Schema

### Patient
- Basic demographics and contact information
- Hedera account ID and wallet address
- Consent status and transaction IDs
- Access logs and audit trail

### GenomicData
- File metadata and storage information
- Quality metrics and variant data
- AI analysis results
- Access control and audit logs

### Consent
- Consent details and scope
- Patient signature and verification
- Hedera transaction IDs
- Access control for authorized entities

## Development

The server includes:
- **Health check endpoint**: `GET /health`
- **Comprehensive error handling**
- **Request logging with Morgan**
- **Security headers with Helmet**
- **CORS configuration**
- **Rate limiting**

## Testing

```bash
npm test
```

## License

MIT License - Hedera Africa Hackathon Project
