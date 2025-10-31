# RDZ Health App - Architecture & Flow Diagrams

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (React)"
        UI[React UI Components]
        WC[WalletConnect Client]
        CTX[React Contexts]
    end
    
    subgraph "Backend (Node.js/Express)"
        API[Express API Server]
        HEDERA[Hedera Service]
        INC[Incentive Service]
        AI[ChatGPT Service]
        RESEARCH[Research Services]
        DB[(MongoDB)]
    end
    
    subgraph "Hedera Network"
        HCS[Hedera Consensus Service]
        HTS[Hedera Token Service]
        MIRROR[Mirror Node]
    end
    
    subgraph "External Services"
        OPENAI[OpenAI ChatGPT API]
        HASHSCAN[HashScan Explorer]
        RESEARCHHUB[ResearchHub API]
        PUBMED[PubMed API]
        CLINVAR[ClinVar API]
    end
    
    UI --> API
    WC --> HEDERA
    CTX --> UI
    
    API --> HEDERA
    API --> INC
    API --> AI
    API --> RESEARCH
    API --> DB
    
    HEDERA --> HCS
    HEDERA --> HTS
    HEDERA --> MIRROR
    
    AI --> OPENAI
    RESEARCH --> RESEARCHHUB
    RESEARCH --> PUBMED
    RESEARCH --> CLINVAR
    UI --> HASHSCAN
```

## 2. User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React Frontend
    participant WC as WalletConnect
    participant HP as HashPack Wallet
    participant API as Backend API
    participant HCS as Hedera Consensus Service
    participant DB as MongoDB
    
    U->>UI: Access App
    UI->>U: Show Auth Page
    U->>UI: Click "Connect Wallet"
    UI->>WC: Open WalletConnect Modal
    WC->>HP: Request Connection
    HP->>U: Show Connection Request
    U->>HP: Approve Connection
    HP->>WC: Return Account ID
    WC->>UI: Set Account ID
    UI->>API: GET /api/users/by-hedera-account/:id
    API->>DB: Query User Data
    DB->>API: Return User/Null
    alt User Exists
        API->>UI: Return User Data
    else New User
        API->>UI: Return Null
        UI->>U: Show Account Lookup Flow
        U->>UI: Enter Patient ID
        UI->>API: POST /api/users/create
        API->>DB: Create User Record
        API->>HCS: Log User Creation Activity
        HCS->>API: Return Transaction ID
        API->>UI: Return User Data
    end
    UI->>U: Show Main App
```

## 3. Consent Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Frontend
    participant API as Backend
    participant HEDERA as Hedera Service
    participant HTS as Hedera Token Service
    participant HCS as Hedera Consensus Service
    participant DB as MongoDB
    
    U->>UI: Toggle Consent Switch
    UI->>UI: Show Loading State
    UI->>API: POST /api/consent/mint
    API->>HEDERA: Create Consent NFT
    HEDERA->>HTS: Mint NFT Transaction
    HTS->>HEDERA: Return NFT Details
    HEDERA->>HCS: Log Activity
    HCS->>HEDERA: Return Transaction ID
    HEDERA->>API: Return NFT + Activity
    API->>DB: Save Consent Record
    API->>UI: Return Success Response
    UI->>U: Show Success Message
    UI->>API: GET /api/consent (Refresh)
    API->>DB: Query Updated Consents
    DB->>API: Return Consent List
    API->>UI: Return Updated Data
    UI->>U: Update UI with New Status
```

## 4. Incentive System Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Frontend
    participant API as Backend
    participant INC as Incentive Service
    participant HEDERA as Hedera Service
    participant HTS as Hedera Token Service
    participant HCS as Hedera Consensus Service
    participant DB as MongoDB
    
    U->>UI: Perform Action (Consent/AI)
    UI->>API: Action Request
    API->>INC: Check Incentive Eligibility
    INC->>INC: Calculate RDZ Amount
    INC->>HEDERA: Mint & Transfer RDZ
    HEDERA->>HTS: Create Transfer Transaction
    HTS->>HEDERA: Return Transaction ID
    HEDERA->>HCS: Log Incentive Activity
    HCS->>HEDERA: Return Activity Transaction ID
    HEDERA->>INC: Return Success
    INC->>API: Return Incentive Details
    API->>DB: Log Activity
    API->>UI: Return Action + Incentive
    UI->>U: Show Success + RDZ Earned
```

## 5. AI Features Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Frontend
    participant API as Backend
    participant AI as ChatGPT Service
    participant OPENAI as OpenAI API
    participant HEDERA as Hedera Service
    participant HCS as Hedera Consensus Service
    participant DB as MongoDB
    
    Note over U,DB: AI Chat Assistant Flow
    U->>UI: Ask Question in Chat
    UI->>API: POST /api/ai/chat
    API->>AI: Process Chat Request
    AI->>OPENAI: Send Chat Prompt
    OPENAI->>AI: Return Chat Response
    AI->>API: Return Chat Response
    API->>HEDERA: Log Chat Activity
    HEDERA->>HCS: Submit Chat to Topic
    HCS->>HEDERA: Return Transaction ID
    HEDERA->>API: Return Success
    API->>DB: Save Chat Activity
    API->>UI: Return Chat Response
    UI->>U: Display Chat Response
    
    Note over U,DB: FHIR Translation Flow
    U->>UI: Request FHIR Translation
    UI->>API: POST /api/ai/translate-fhir
    API->>AI: Process FHIR Request
    AI->>OPENAI: Send FHIR Translation Prompt
    OPENAI->>AI: Return FHIR Bundle
    AI->>API: Return FHIR Bundle
    API->>HEDERA: Log FHIR Activity
    HEDERA->>HCS: Submit FHIR to Topic
    HCS->>HEDERA: Return Transaction ID
    HEDERA->>API: Return Success
    API->>DB: Save FHIR Activity
    API->>UI: Return FHIR Bundle
    UI->>U: Display FHIR Bundle (Copy/Download)
    
    Note over U,DB: Genomic Insights Flow
    U->>UI: Request Genomic Insights
    UI->>API: POST /api/ai/generate-insights
    API->>AI: Process Insights Request
    AI->>OPENAI: Send Genomic Analysis Prompt
    OPENAI->>AI: Return Genomic Insights
    AI->>API: Return Genomic Insights
    API->>HEDERA: Log Insights Activity
    HEDERA->>HCS: Submit Insights to Topic
    HCS->>HEDERA: Return Transaction ID
    HEDERA->>API: Return Success
    API->>DB: Save Insights Activity
    API->>UI: Return Genomic Insights
    UI->>U: Display Genomic Insights
```

## 6. Data Flow Architecture

```mermaid
graph LR
    subgraph "User Layer"
        U[User]
        HP[HashPack Wallet]
    end
    
    subgraph "Frontend Layer"
        UI[React Components]
        CTX[Context Providers]
        HOOKS[Custom Hooks]
    end
    
    subgraph "API Layer"
        ROUTES[Express Routes]
        MIDDLEWARE[Middleware]
        VALIDATION[Input Validation]
    end
    
    subgraph "Service Layer"
        HEDERA[Hedera Service]
        INC[Incentive Service]
        AI[AI Service]
        AUTH[Auth Service]
        RESEARCH[Research Services]
    end
    
    subgraph "Data Layer"
        DB[(MongoDB)]
        HCS[Hedera HCS]
        HTS[Hedera HTS]
    end
    
    U --> HP
    HP --> UI
    UI --> CTX
    CTX --> HOOKS
    HOOKS --> ROUTES
    ROUTES --> MIDDLEWARE
    MIDDLEWARE --> VALIDATION
    VALIDATION --> HEDERA
    VALIDATION --> INC
    VALIDATION --> AI
    VALIDATION --> RESEARCH
    HEDERA --> HCS
    HEDERA --> HTS
    INC --> HTS
    AI --> DB
    RESEARCH --> DB
    HEDERA --> DB
```

## 7. Mobile App State Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant APP as Mobile App
    participant WC as WalletConnect
    participant API as Backend
    participant HTS as Hedera Token Service
    participant HCS as Hedera Consensus Service
    participant POLL as Transaction Polling
    
    U->>APP: Enable Consent
    APP->>WC: Open Wallet
    U->>WC: Sign Transaction
    WC->>APP: Return to App
    APP->>POLL: Add Pending Transaction
    POLL->>API: Poll Transaction Status
    API->>HTS: Check NFT Transaction Status
    HTS->>API: Return NFT Status
    API->>HCS: Check Activity Log Status
    HCS->>API: Return Activity Status
    API->>POLL: Return Combined Status
    alt Transaction Complete
        POLL->>APP: Trigger UI Refresh
        APP->>API: Refresh Data
        API->>APP: Return Updated Data
        APP->>U: Show Success
    else Transaction Pending
        POLL->>POLL: Continue Polling
    end
```

## 8. Security & Privacy Flow

```mermaid
graph TB
    subgraph "Data Mesh Protection (TEE)"
        PII[PII Data]
        ISOLATED[Isolated Processing]
        ENCRYPT[Data Encryption]
        ANON[Anonymized Data]
        HASH[Consent Hashes]
    end
    
    subgraph "Data Mesh Architecture"
        CATALOG[Data Catalog]
        DOMAINS[Data Domains]
        LINEAGE[Data Lineage]
        GOVERNANCE[Data Governance]
    end
    
    subgraph "DLT Security"
        HCS[Hedera HCS - Activity Logs]
        HTS[Hedera HTS - NFT Ownership]
        MIRROR[Mirror Node - Public Records]
    end
    
    subgraph "Application Security"
        AUTH[Wallet Authentication]
        RATE[Rate Limiting]
        VALID[Input Validation]
        CORS[CORS Protection]
    end
    
    PII --> ISOLATED
    ISOLATED --> ENCRYPT
    ENCRYPT --> ANON
    ANON --> HASH
    HASH --> HCS
    HCS --> MIRROR
    
    AUTH --> RATE
    RATE --> CORS
    CORS --> VALID
    VALID --> ISOLATED
    
    ISOLATED --> CATALOG
    CATALOG --> DOMAINS
    DOMAINS --> LINEAGE
    LINEAGE --> GOVERNANCE
    GOVERNANCE --> HCS
    GOVERNANCE --> HTS
```

## 9. Component Architecture

```mermaid
graph TB
    subgraph "App.tsx"
        AUTH[AuthPage]
        MAIN[RdzHealthApp]
    end
    
    subgraph "Main App Components"
        PROFILE[ProfileTab]
        AI[AITab]
        ACTIVITY[ActivityTab]
        DATA[DataTab]
        RESOURCES[ResourcesTab]
        WALLET[WalletTab]
    end
    
    subgraph "Shared Components"
        CONSENT[ConsentManagement]
        NAVBAR[Navbar]
        DIALOGS[Dialog Components]
    end
    
    subgraph "Context Providers"
        USER[UserContext]
        WC[WalletConnectContext]
    end
    
    subgraph "Custom Hooks"
        APPSTATE[useAppState]
        WALLETREFRESH[useWalletStateRefresh]
        TXPOLLING[useTransactionPolling]
    end
    
    AUTH --> MAIN
    MAIN --> PROFILE
    MAIN --> AI
    MAIN --> ACTIVITY
    MAIN --> DATA
    MAIN --> RESOURCES
    MAIN --> WALLET
    
    PROFILE --> CONSENT
    AI --> CONSENT
    DATA --> CONSENT
    
    MAIN --> USER
    MAIN --> WC
    
    MAIN --> APPSTATE
    MAIN --> WALLETREFRESH
    MAIN --> TXPOLLING
```

## 10. Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        LB[Load Balancer]
        WEB[Web Server]
        API[API Server]
        DB[(MongoDB)]
    end
    
    subgraph "Hedera Network"
        MAINNET[Hedera Mainnet]
        TESTNET[Hedera Testnet]
    end
    
    subgraph "External Services"
        OPENAI[OpenAI API]
        HASHSCAN[HashScan]
        RESEARCHHUB[ResearchHub API]
        PUBMED[PubMed API]
        CLINVAR[ClinVar API]
    end
    
    LB --> WEB
    LB --> API
    API --> DB
    API --> MAINNET
    API --> OPENAI
    API --> RESEARCHHUB
    API --> PUBMED
    API --> CLINVAR
    WEB --> HASHSCAN
```

## How to Use These Diagrams

1. **Copy the Mermaid code** from any diagram above
2. **Paste it into**:
   - GitHub/GitLab markdown files (renders automatically)
   - [Mermaid Live Editor](https://mermaid.live/)
   - VS Code with Mermaid extension
   - Notion, Confluence, or other tools that support Mermaid

3. **Customize** the diagrams by modifying the Mermaid syntax to match your specific needs

## Key Architecture Principles

- **Decentralized Identity**: Users control their data through wallet authentication
- **Immutable Logging**: All activities logged on Hedera HCS
- **Tokenized Consents**: NFTs represent user consent with ownership proof
- **Incentive Alignment**: RDZ tokens reward user participation
- **Privacy by Design**: PII never stored on-chain, only consent hashes
- **Mobile-First**: Optimized for mobile wallet interactions
- **TEE-like Processing**: Sensitive data processed in controlled, isolated environments
- **Data Mesh Governance**: Decentralized data management with lineage tracking

## Security & Privacy Features

### Data Protection (TEE-like Approach)
- **Isolated Processing**: Sensitive genomic data processed in controlled, isolated environments
- **Data Encryption**: Genomic data encrypted in transit and at rest
- **Anonymization**: PII removed before any DLT interaction
- **Consent Hashes**: Only cryptographic hashes stored on-chain, never raw data

### Data Mesh Architecture
- **Data Catalog**: Centralized metadata and schema registry for genomic data
- **Data Domains**: Organized data ownership by functional domains (consent, genomic, AI)
- **Data Lineage**: Complete tracking of data transformations and usage
- **Data Governance**: Policies and rules governing data access and usage

### DLT Security
- **Immutable Logs**: All activities logged on Hedera HCS for audit trail
- **NFT Ownership**: Consent ownership proven through Hedera HTS
- **Public Verification**: Mirror node provides transparent transaction history

### Application Security
- **Wallet Authentication**: Users control access through their Hedera wallet
- **Rate Limiting**: Prevents abuse and ensures system stability
- **Input Validation**: All user inputs validated before processing
- **CORS Protection**: Cross-origin requests properly configured

## AI Features Breakdown

### 1. Chat Assistant
- **Purpose**: Interactive Q&A about genomic data and health
- **Input**: User questions about their genomic data
- **Processing**: ChatGPT analyzes genomic data and provides personalized responses
- **Output**: Conversational responses with health insights
- **Incentive**: 10 RDZ tokens per chat session
- **Logging**: All conversations logged to Hedera HCS

### 2. FHIR Translation
- **Purpose**: Convert genomic data to FHIR R4 standard format
- **Input**: User's genomic data from the system
- **Processing**: ChatGPT structures data according to FHIR R4 specifications
- **Output**: FHIR Bundle with Patient, Observation, and DiagnosticReport resources
- **Features**: Copy to clipboard, download as JSON
- **Incentive**: 50 RDZ tokens per FHIR translation
- **Logging**: FHIR generation logged to Hedera HCS

### 3. Genomic Insights
- **Purpose**: Generate personalized genomic analysis and recommendations
- **Input**: User's complete genomic profile
- **Processing**: ChatGPT analyzes variants, phenotypes, and health markers
- **Output**: Comprehensive insights including:
  - Risk assessments
  - Drug response predictions
  - Lifestyle recommendations
  - Genetic trait analysis
- **Incentive**: 25 RDZ tokens per insights generation
- **Logging**: Insights generation logged to Hedera HCS

### AI Integration Benefits
- **Personalized Healthcare**: AI-powered insights based on individual genomic data
- **Interoperability**: FHIR R4 standard ensures compatibility with healthcare systems
- **Transparency**: All AI interactions logged on ledger for audit trail
- **Incentivized Usage**: RDZ tokens reward user engagement with AI features
- **Privacy-Preserving**: Genomic data processed securely without permanent storage

## Research Resources Integration

### 1. ResearchHub Integration
- **Purpose**: Automatically search for relevant research papers based on patient condition
- **Input**: Patient condition from genomic data
- **Processing**: ResearchHub API search for condition-related papers
- **Output**: List of research papers with title, authors, DOI, citations, and publication date
- **Features**: 
  - Automatic search on condition availability
  - Direct links to ResearchHub paper pages
  - Citation count and publication date display
- **Styling**: Purple-themed cards (#3F37C9) with consistent card format

### 2. PubMed Integration
- **Purpose**: Access peer-reviewed research articles from PubMed database
- **Input**: Genetic variants and condition data from genomic profile
- **Processing**: PubMed API search based on genetic findings and condition
- **Output**: Research articles with relevance scores, abstracts, and metadata
- **Features**:
  - Relevance scoring (1-10 scale)
  - Abstract previews
  - Search type categorization (treatment, clinical trial, gene therapy, etc.)
  - Direct links to PubMed articles with PMID
- **Styling**: Green-themed cards (#2E7D32) matching ResearchHub card format
- **Integration**: Articles fetched when user generates ClinVar insights

### 3. ClinVar Integration
- **Purpose**: Genetic variant analysis with clinical significance data
- **Input**: Genetic variants from patient genomic data
- **Processing**: ClinVar API query for variant clinical significance
- **Output**: 
  - Variant clinical significance (pathogenic, likely pathogenic, VUS, etc.)
  - Disease associations
  - Review status
  - Population frequency data
- **Features**:
  - Automatic variant matching
  - African population-specific data
  - Summary statistics and insights
- **Integration**: Variants analyzed when user generates insights

### 4. Unified Resource Display
- **Consistent Card Format**: All research sources use the same card design with source-specific colors
- **Organization**: Resources tab organizes all research by source
- **Priority Order**: 
  1. ResearchHub (top) - Purple theme
  2. PubMed Articles - Green theme
  3. ClinVar Variants - Summary display
  4. African Population Data - When available
- **User Experience**: 
  - Automatic updates when condition data is available
  - Loading states during API calls
  - Error handling and fallback messages
  - Direct navigation from AI tab to Resources

### Research Integration Benefits
- **Comprehensive Research Access**: Single location for all research resources
- **Automatic Discovery**: Research automatically found based on patient condition
- **Consistent UX**: Unified card format across all research sources
- **Source Identification**: Color-coded cards for easy source identification
- **Evidence-Based Insights**: Access to latest research to inform healthcare decisions
