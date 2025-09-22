#!/bin/bash

# Genomic Data Mesh - Development Startup Script
echo "🧬 Starting Genomic Data Mesh Development Environment"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server && npm install && cd ..
fi

# Create .env file for server if it doesn't exist
if [ ! -f "server/.env" ]; then
    echo "⚙️  Creating server .env file..."
    cp server/.env.example server/.env
    echo "📝 Please edit server/.env with your configuration"
fi

echo ""
echo "🚀 Starting both frontend and backend..."
echo "Frontend will be available at: http://localhost:3000"
echo "Backend API will be available at: http://localhost:5000"
echo "Health check: http://localhost:5000/health"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Start both services
npm run dev
