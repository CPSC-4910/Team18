#!/bin/bash
echo "Starting application with PM2..."

# --- NVM SOURCING ---
# ... (Keep NVM sourcing logic as before) ...
# --- END NVM SOURCING ---

# --- FETCH SECRETS ---
echo "Fetching credentials from Secrets Manager..."
SECRET_ARN="arn:aws:secretsmanager:us-east-1:274815321855:secret:truckpoints/database-8LGHrK" # Verify ARN
REGION="us-east-1"

SECRET_VALUES=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --region "$REGION" --query SecretString --output text)

if [ -z "$SECRET_VALUES" ]; then
    echo "ERROR: Failed to fetch secrets from Secrets Manager." >&2
    exit 1
fi

echo "Exporting credentials as environment variables..."
# Use jq to parse JSON and export (ensure jq is installed: sudo yum install jq -y)

# Database Credentials
export DB_HOST=$(echo $SECRET_VALUES | jq -r '.DB_HOST')
export DB_PORT=$(echo $SECRET_VALUES | jq -r '.DB_PORT // "3306"')
export DB_USER=$(echo $SECRET_VALUES | jq -r '.DB_USER')
export DB_PASSWORD=$(echo $SECRET_VALUES | jq -r '.DB_PASSWORD')
export DB_NAME=$(echo $SECRET_VALUES | jq -r '.DB_NAME')

# Email Credentials (Add these)
export EMAIL_USER=$(echo $SECRET_VALUES | jq -r '.EMAIL_USER')
export EMAIL_PASS=$(echo $SECRET_VALUES | jq -r '.EMAIL_PASS')

# eBay Credentials (Add these)
export EBAY_CLIENT_ID=$(echo $SECRET_VALUES | jq -r '.EBAY_CLIENT_ID')
export EBAY_CLIENT_SECRET=$(echo $SECRET_VALUES | jq -r '.EBAY_CLIENT_SECRET')

# Verify (optional, remove in production)
echo "DB_HOST is set."
echo "EMAIL_USER is set."
echo "EBAY_CLIENT_ID is set."
# --- END FETCH SECRETS ---


# Define app directories
BACKEND_DIR="/home/ec2-user/app/App/backend"
FRONTEND_DIR="/home/ec2-user/app/App/frontend"

# Start the backend
echo "Starting backend process in $BACKEND_DIR..."
pm2 start npm --name "backend" --cwd "$BACKEND_DIR" -- start

# Start the frontend
echo "Starting frontend process in $FRONTEND_DIR..."
pm2 start npm --name "frontend" --cwd "$FRONTEND_DIR" -- run dev -- --host --port 5173

pm2 save --force

echo "Application start commands issued via PM2."
echo "Use 'pm2 list' to see status."
