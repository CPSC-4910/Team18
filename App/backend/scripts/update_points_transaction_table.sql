-- Update PointsTransaction table to support deduct type and require reason
-- Run these ALTER statements if the table already exists

-- Add 'deduct' to the type ENUM
ALTER TABLE PointsTransaction 
MODIFY COLUMN type ENUM('award', 'deduct', 'redeem') NOT NULL;

-- Make reason required (if it's currently nullable)
ALTER TABLE PointsTransaction 
MODIFY COLUMN reason VARCHAR(255) NOT NULL;

