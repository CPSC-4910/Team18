-- Add point_alerts_enabled column to users table
-- Run this if the users table already exists

ALTER TABLE users 
ADD COLUMN point_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE;

