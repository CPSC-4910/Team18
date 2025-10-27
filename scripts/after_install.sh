#!/bin/bash
echo "Installing dependencies..."

# Navigate to the backend directory (CodeDeploy copies files here first)
cd /home/ec2-user/app/backend
echo "Installing backend dependencies..."
npm install --production # Use --production to skip devDependencies

# Navigate to the frontend directory
cd /home/ec2-user/app/frontend
echo "Installing frontend dependencies..."
# If your frontend needs production dependencies, install them.
# If it's just build output, you might skip this.
# npm install --production

# If your frontend needs a build step *on the server* (less common with CI/CD):
# npm run build

echo "Dependencies installation complete."
