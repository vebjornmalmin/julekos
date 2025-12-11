#!/bin/bash

# Julekos Azure Deployment Script
# This script creates a ZIP package and deploys to Azure App Service

set -e

echo "🎄 Starting Julekos deployment..."

# Configuration
RESOURCE_GROUP="vm-fagdag"
APP_NAME="julespillet"
ZIP_FILE="julekos-deploy.zip"

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure. Please run: az login"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Remove old zip if exists
if [ -f "$ZIP_FILE" ]; then
    echo "🗑️  Removing old deployment package..."
    rm "$ZIP_FILE"
fi

# Create deployment package
echo "📦 Creating deployment package..."
zip -r "$ZIP_FILE" package.json server.js public/ node_modules/ -x "*.git*" -x "*.DS_Store" -q

echo "✅ Package created: $ZIP_FILE"

# Deploy to Azure
echo "🚀 Deploying to Azure App Service..."
az webapp deploy \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --src-path "$ZIP_FILE" \
    --type zip

echo "✅ Deployment complete!"
echo "🌐 Your app: https://$APP_NAME-hzfzgvf0chfnbmgr.northeurope-01.azurewebsites.net"
