#!/bin/bash

echo "Starting Three Sisters Oyster Backend Server..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found"
    echo "Please copy env.example to .env and configure your settings"
    echo
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo
fi

# Start the server
echo "Starting server on http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo
npm run dev 