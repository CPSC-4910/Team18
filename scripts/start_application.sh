#!/bin/bash
echo "Starting application with PM2..."

# --- NVM SOURCING ---
# Source NVM for the ec2-user. Adjust path if needed.
export NVM_DIR="/home/ec2-user/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  echo "Sourcing NVM..."
  . "$NVM_DIR/nvm.sh"
  # Verify NVM is sourced
  command -v nvm
  echo "Using Node version 20..."
  nvm use 20
  echo "Current Node version: $(node -v)"
  echo "Current NPM version: $(npm -v)"
else
  echo "NVM directory or nvm.sh not found at $NVM_DIR" >&2
  # exit 1 # Optional: exit if NVM isn't found
fi
# --- END NVM SOURCING ---


# Define app directories
BACKEND_DIR="/home/ec2-user/app/App/backend"
FRONTEND_DIR="/home/ec2-user/app/App/frontend"

# Start the backend using --cwd
echo "Starting backend process in $BACKEND_DIR..."
# Tells PM2 to run 'npm start' from the BACKEND_DIR
pm2 start npm --name "backend" --cwd "$BACKEND_DIR" -- start

# Start the frontend using --cwd
echo "Starting frontend process in $FRONTEND_DIR..."
# Still recommend against 'npm run dev' for production
pm2 start npm --name "frontend" --cwd "$FRONTEND_DIR" -- run dev -- --host --port 5173

# --- UNCOMMENT THIS ---
# Save the PM2 process list so they restart on reboot
pm2 save --force

echo "Application start commands issued via PM2."
echo "Use 'pm2 list' to see status."
