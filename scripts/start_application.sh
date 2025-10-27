#!/bin/bash
echo "Starting application with PM2..."

# Source NVM - Needed if PM2 doesn't pick up the right Node version automatically
# May need adjustment depending on how NVM is installed for the runas user
# export NVM_DIR="$HOME/.nvm"
# [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# nvm use 20 # Or the specific version needed

# Start the backend
cd /home/ec2-user/app/backend
echo "Starting backend process..."
# Assumes 'npm start' is defined in backend/package.json
pm2 start npm --name "backend" -- start

# Start the frontend
cd /home/ec2-user/app/frontend
echo "Starting frontend process..."

# --- IMPORTANT ---
# Using 'npm run dev' is NOT recommended for production deployments.
# Ideally, your GitHub Action should build the frontend, and you deploy the build output.
# Then, you'd either serve the static files via Nginx/Apache or your backend.
# If you MUST run the dev server (e.g., for testing):
pm2 start npm --name "frontend" -- run dev -- --host --port 5173

# Make PM2 remember these processes after reboot
pm2 save

echo "Application started successfully via PM2."
echo "Use 'pm2 list' to see status."
