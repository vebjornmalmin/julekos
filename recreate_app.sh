#!/bin/bash
# Re-create the app from scratch to bypass the stuck 403 state

SUBSCRIPTION="9017d57d-c4df-480d-b92d-7aea2266b0f0"
RG="vm-fagdag"
PLAN_NAME="julekos-plan"
# New unique name
NEW_APP_NAME="julekos-live-$(date +%s)"

echo "--> Setting Subscription..."
az account set --subscription $SUBSCRIPTION

echo "--> Creating NEW Web App '$NEW_APP_NAME'..."
# We reuse the plan, but make a new app
az webapp create --resource-group $RG --plan $PLAN_NAME --name $NEW_APP_NAME --runtime "NODE:20-lts"

echo "--> configuring WebSockets..."
az webapp config set --resource-group $RG --name $NEW_APP_NAME --web-sockets-enabled true

echo "--> Saving new name..."
echo $NEW_APP_NAME > .azure_app_name

echo "--> Deploying code immediately..."
# Using the basic zip deploy which should work on a fresh app
zip -q -r deploy.zip . -x ".git/*" "deploy.zip"
az webapp deploy --resource-group $RG --name $NEW_APP_NAME --src-path deploy.zip --clean true --restart true --type zip

echo "--> Cleaning up..."
rm deploy.zip

echo "=========================================================="
echo " RE-CREATION SUCCESS"
echo " Play here: https://$NEW_APP_NAME.azurewebsites.net"
echo "=========================================================="
