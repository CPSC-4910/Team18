-- Create DriverPointAlert table for point change notifications
CREATE TABLE IF NOT EXISTS DriverPointAlert (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_username VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  organization_id INT NOT NULL,
  organization_name VARCHAR(100) NOT NULL,
  points INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  type ENUM('award', 'deduct') NOT NULL,
  sponsor_username VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_driver_username (driver_username),
  INDEX idx_organization_id (organization_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign keys separately (adjust character set if needed)
-- First check: SHOW CREATE TABLE users;
-- Then modify if needed:
-- ALTER TABLE DriverPointAlert MODIFY driver_username VARCHAR(50) CHARACTER SET <charset> COLLATE <collation> NOT NULL;

ALTER TABLE DriverPointAlert 
ADD CONSTRAINT fk_point_alert_driver_username 
FOREIGN KEY (driver_username) REFERENCES users(username) ON DELETE CASCADE;

ALTER TABLE DriverPointAlert 
ADD CONSTRAINT fk_point_alert_organization_id 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

