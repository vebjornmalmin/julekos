#!/bin/bash
# Script to upgrade the App Service Plan to Basic (B1) to fix "QuotaExceeded"

RG="vm-fagdag"
PLAN_NAME="julekos-plan"

# Read the App Name if available
if [ -f .azure_app_name ]; then
    APP_NAME=$(cat .azure_app_name)
else
    echo "Error: Could not find .azure_app_name file. Run setup_azure.sh first."
    exit 1
fi

echo "--> Upgrading App Service Plan '$PLAN_NAME' to Basic (B1) tier..."
echo "    (This solves the QuotaExceeded error and allows Always On)"
az appservice plan update --name $PLAN_NAME --resource-group $RG --sku B1

echo "--> Enabling 'Always On' for the web app '$APP_NAME'..."
az webapp config set --resource-group $RG --name $APP_NAME --always-on true

echo "--> Ensuring app is started..."
az webapp start --resource-group $RG --name $APP_NAME

echo "--> Deploying application..."
# Zipping manually just in case
zip -q -r deploy.zip . -x ".git/*" "deploy.zip"
az webapp deploy --resource-group $RG --name $APP_NAME --src-path deploy.zip --clean true --restart true --type zip

echo "--> Cleaning up..."
rm deploy.zip

echo "=========================================================="
echo " UPGRADE & DEPLOY COMPLETE"
echo " Play here: https://$APP_NAME.azurewebsites.net"
echo "=========================================================="
