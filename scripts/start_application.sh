#!/bin/bash
echo "Starting application with PM2..."

# --- NVM SOURCING ---
export NVM_DIR="/home/ec2-user/.nvm"
NVM_NODE_VERSION="v20.19.5" # Define the specific Node version you need
NODE_PATH_PREFIX="$NVM_DIR/versions/node/$NVM_NODE_VERSION/bin" # Path to that version's Node/NPM

if [ -s "$NVM_DIR/nvm.sh" ]; then
  echo "Sourcing NVM..."
  . "$NVM_DIR/nvm.sh" # Load NVM into this script's session
  echo "Using Node version $NVM_NODE_VERSION..."
  nvm use $NVM_NODE_VERSION # Set the version for commands run directly in script
  echo "Current Node version (in script): $(node -v)"
  echo "Current NPM version (in script): $(npm -v)"

  # Verify the specific NPM executable exists
  if [ ! -x "$NODE_PATH_PREFIX/npm" ]; then
      echo "ERROR: NVM npm executable not found at $NODE_PATH_PREFIX/npm" >&2
      exit 1
  fi
else
  echo "NVM directory or nvm.sh not found at $NVM_DIR" >&2
  exit 1 # Exit if NVM isn't found/sourced
fi
# --- END NVM SOURCING ---


# --- FETCH SECRETS ---
echo "Fetching credentials from Secrets Manager..."
SECRET_ARN="arn:aws:secretsmanager:us-east-1:274815321855:secret:truckpoints/database-8LGHrK" # Verify ARN
REGION="us-east-1"

# Ensure jq is installed (add 'sudo yum install jq -y' to AfterInstall if needed)
SECRET_VALUES=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --region "$REGION" --query SecretString --output text)

if [ -z "$SECRET_VALUES" ]; then
    echo "ERROR: Failed to fetch secrets from Secrets Manager." >&2
    exit 1
fi

echo "Exporting credentials as environment variables..."
# Database Credentials
export DB_HOST=$(echo $SECRET_VALUES | jq -r '.DB_HOST')
export DB_PORT=$(echo $SECRET_VALUES | jq -r '.DB_PORT // "3306"')
export DB_USER=$(echo $SECRET_VALUES | jq -r '.DB_USER')
export DB_PASSWORD=$(echo $SECRET_VALUES | jq -r '.DB_PASSWORD')
export DB_NAME=$(echo $SECRET_VALUES | jq -r '.DB_NAME')
# Email Credentials
export EMAIL_USER=$(echo $SECRET_VALUES | jq -r '.EMAIL_USER')
export EMAIL_PASS=$(echo $SECRET_VALUES | jq -r '.EMAIL_PASS')
# eBay Credentials
export EBAY_CLIENT_ID=$(echo $SECRET_VALUES | jq -r '.EBAY_CLIENT_ID')
export EBAY_CLIENT_SECRET=$(echo $SECRET_VALUES | jq -r '.EBAY_CLIENT_SECRET')

echo "DB_HOST, EMAIL_USER, EBAY_CLIENT_ID environment variables exported."
# --- END FETCH SECRETS ---


# Define app directories
BACKEND_DIR="/home/ec2-user/app/App/backend"
FRONTEND_DIR="/home/ec2-user/app/App/frontend"

# --- Start PM2 Processes using Absolute Path to NVM's NPM ---
echo "Starting backend process in $BACKEND_DIR using $NODE_PATH_PREFIX/npm..."
# Use the full path to the correct npm version for PM2
pm2 start "$NODE_PATH_PREFIX/npm" --name "backend" --cwd "$BACKEND_DIR" -- start

echo "Starting frontend process in $FRONTEND_DIR using $NODE_PATH_PREFIX/npm..."
# Use the full path to the correct npm version for PM2
pm2 start "$NODE_PATH_PREFIX/npm" --name "frontend" --cwd "$FRONTEND_DIR" -- run dev -- --host --port 5173

# --- End PM2 Start ---

pm2 save --force

echo "Application start commands issued via PM2 using specific Node version."
echo "Use 'pm2 list' to see status."
