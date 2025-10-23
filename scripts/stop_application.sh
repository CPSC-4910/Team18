#!/bin/bash
echo "Stopping existing backend and frontend processes with PM2..."
# Stop and delete any processes managed by PM2 with these names
# The '|| true' prevents the script from failing if the process doesn't exist
pm2 stop backend || true
pm2 delete backend || true
pm2 stop frontend || true
pm2 delete frontend || true
echo "PM2 processes stopped and deleted."
