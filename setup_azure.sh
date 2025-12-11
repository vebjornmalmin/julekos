#!/bin/bash
# Fast and dirty setup script for Azure

# Config
SUBSCRIPTION="9017d57d-c4df-480d-b92d-7aea2266b0f0"
RG="vm-fagdag"
LOCATION="northeurope" # Assuming Norway/Europe based on "Crayon" and "Vebjørn"
PLAN_NAME="julekos-plan"
APP_NAME="julekos-game-$(date +%s)" # Generates a unique name using timestamp

echo "--> Setting Subscription to $SUBSCRIPTION..."
az account set --subscription $SUBSCRIPTION

echo "--> Creating App Service Plan '$PLAN_NAME' in '$RG' (Free Tier F1, Linux)..."
# Creates the server farm. F1 is free.
az appservice plan create --name $PLAN_NAME --resource-group $RG --sku F1 --is-linux --location $LOCATION

echo "--> Creating Web App '$APP_NAME'..."
# Creates the actual app container
az webapp create --resource-group $RG --plan $PLAN_NAME --name $APP_NAME --runtime "NODE:20-lts"

echo "--> Enabling WebSockets (Required for the game)..."
az webapp config set --resource-group $RG --name $APP_NAME --web-sockets-enabled true

echo "--> Saving App Name for the deployment script..."
echo $APP_NAME > .azure_app_name

echo "=========================================================="
echo " SETUP COMPLETE"
echo " App URL: https://$APP_NAME.azurewebsites.net"
echo " Next step: Run './deploy_azure.sh' to upload the game."
echo "=========================================================="
