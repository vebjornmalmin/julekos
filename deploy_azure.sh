#!/bin/bash
# Fast and dirty deployment script

RG="vm-fagdag"

# Read the App Name saved by the setup script
if [ -f .azure_app_name ]; then
    APP_NAME=$(cat .azure_app_name)
else
    echo "Error: Could not find .azure_app_name file."
    echo "Please run ./setup_azure.sh first!"
    exit 1
fi

echo "--> Preparing deployment for '$APP_NAME'..."

echo "--> Restarting web app '$APP_NAME' (Stop/Start)..."
az webapp stop --resource-group $RG --name $APP_NAME
sleep 5
az webapp start --resource-group $RG --name $APP_NAME
echo "--> Waiting 30 seconds for the app to initialize..."
sleep 30

echo "--> Zipping application files (INCLUDING node_modules)..."
# Create a zip archive manually to ensure path correctness
zip -q -r deploy.zip . -x ".git/*" "deploy.zip"

echo "--> Deploying application to Azure (This might take a few minutes)..."
# Use the newer 'az webapp deploy' but with a file path
az webapp deploy --resource-group $RG --name $APP_NAME --src-path deploy.zip --clean true --restart true --type zip

echo "--> Cleaning up..."
rm deploy.zip

echo "------------------------------------------------"
echo "Deployment Success!"
