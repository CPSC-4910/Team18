-- Create Order table
CREATE TABLE IF NOT EXISTS `Order` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `driver_username` VARCHAR(50) NOT NULL,
  `organization_id` INT NOT NULL,
  `total_points` INT NOT NULL DEFAULT 0,
  `status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_driver_username` (`driver_username`),
  INDEX `idx_organization_id` (`organization_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create OrderItem table
CREATE TABLE IF NOT EXISTS `OrderItem` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `item_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `points_cost` INT NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `Order`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`item_id`) REFERENCES `OrganizationCatalog`(`id`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_item_id` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

