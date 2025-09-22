# 🚀 Genomic Data Mesh - Startup Guide

## Quick Start Options

### Option 1: Simple Development (Recommended for Hackathon)

```bash
# Install all dependencies
npm run install-all

# Start both frontend and backend
npm run dev
```

**What this does:**
- ✅ Starts React frontend on `http://localhost:3000`
- ✅ Starts Node.js backend on `http://localhost:5000`
- ✅ Both services run simultaneously
- ✅ Auto-reloads on code changes

### Option 2: Using the Startup Script

```bash
# Make script executable (first time only)
chmod +x start-dev.sh

# Run the startup script
./start-dev.sh
```

**What this does:**
- ✅ Checks for Node.js and npm
- ✅ Installs dependencies if needed
- ✅ Creates server .env file from template
- ✅ Starts both services with helpful output

### Option 3: Manual Start (Separate Terminals)

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm start
```

### Option 4: Docker (Full Stack)

```bash
# Start everything with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

## 🔧 Configuration

### Backend Configuration

1. **Copy environment file:**
   ```bash
   cp server/.env.example server/.env
   ```

2. **Edit server/.env with your settings:**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/genomic-data-mesh
   HEDERA_OPERATOR_ID=0.0.123456
   HEDERA_OPERATOR_KEY=your_private_key_here
   ```

### Frontend Configuration

The frontend will automatically connect to the backend at `http://localhost:5000/api`

## 📊 Available Services

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React app with wallet integration |
| **Backend API** | http://localhost:5000/api | Node.js API with Hedera integration |
| **Health Check** | http://localhost:5000/health | Backend health status |
| **MongoDB** | localhost:27017 | Database (if using Docker) |

## 🧬 API Endpoints

### Patients
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient by ID

### Genomic Data
- `GET /api/genomic` - List genomic data
- `POST /api/genomic` - Upload genomic file
- `GET /api/genomic/patient/:patientId` - Get patient's data

### Consent
- `GET /api/consent` - List consents
- `POST /api/consent` - Create consent (submits to Hedera)
- `GET /api/consent/verify/:transactionId` - Verify on blockchain

### AI Analysis
- `GET /api/ai/insights/:patientId` - Get AI insights
- `POST /api/ai/analyze` - Run AI analysis
- `GET /api/ai/models` - Available AI models

## 🔗 Integration with Frontend

The backend is designed to work seamlessly with your React frontend:

1. **Wallet Integration**: Patients link their Hedera accounts
2. **Real Transactions**: Frontend triggers actual blockchain transactions
3. **Consent Management**: Patients control their data through wallet signatures
4. **AI Insights**: Real-time genomic analysis results

## 🎯 For Your Hackathon Demo

### What You Can Show:

1. **Real Wallet Connection**: Connect HashPack wallet to frontend
2. **Patient Registration**: Create patient with Hedera account
3. **Consent Creation**: Sign consent transaction on blockchain
4. **Data Upload**: Upload genomic data with proper access control
5. **AI Analysis**: Run AI analysis on genomic data
6. **Blockchain Verification**: Verify consent on Hedera explorer

### Demo Flow:

1. **Start both services**: `npm run dev`
2. **Open frontend**: http://localhost:3000
3. **Connect wallet**: Use HashPack extension
4. **Create patient**: Register with Hedera account
5. **Grant consent**: Sign consent transaction
6. **Upload data**: Add genomic data file
7. **Run AI analysis**: Get genomic insights
8. **Verify on blockchain**: Check Hedera explorer

## 🐛 Troubleshooting

### Backend won't start:
- Check if MongoDB is running (if using local MongoDB)
- Verify .env file exists and has correct values
- Check port 5000 is not in use

### Frontend won't connect to backend:
- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify API_URL in frontend configuration

### Wallet connection issues:
- Ensure HashPack extension is installed
- Check browser console for wallet errors
- Verify Hedera network settings

## 📝 Development Commands

```bash
# Install all dependencies
npm run install-all

# Start development (both services)
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Build for production
npm run build-all

# Run with Docker
docker-compose up -d
```

## 🎉 Ready to Demo!

Your Genomic Data Mesh is now ready for the hackathon! You have:

- ✅ **Working wallet integration** with real Hedera transactions
- ✅ **Complete backend API** with blockchain integration
- ✅ **Patient management** with consent control
- ✅ **Genomic data handling** with AI analysis
- ✅ **Real blockchain transactions** on Hedera testnet
- ✅ **Professional architecture** ready for production

**Start your demo with:** `npm run dev` 🚀
