#!/bin/bash
# Alternative Deployment via Local Git

RG="vm-fagdag"

if [ -f .azure_app_name ]; then
    APP_NAME=$(cat .azure_app_name)
else
    echo "Error: .azure_app_name not found."
    exit 1
fi

echo "--> Configuring Local Git deployment for '$APP_NAME'..."
DEPLOYMENT_URL=$(az webapp deployment source config-local-git --name $APP_NAME --resource-group $RG --query url --output tsv)

echo "--> Deployment URL: $DEPLOYMENT_URL"

echo "--> Setting up git remote..."
if git remote | grep -q "azure"; then
    git remote remove azure
fi
git remote add azure "$DEPLOYMENT_URL"

echo "--> Ensuring app is started..."
az webapp start --resource-group $RG --name $APP_NAME

echo "--> Deploying via Git Push..."
# We push the current branch (probably master or main) to azure master
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
git push azure $CURRENT_BRANCH:master

echo "=========================================================="
echo " GIT DEPLOYMENT COMPLETE"
echo " Play here: https://$APP_NAME.azurewebsites.net"
echo "=========================================================="
