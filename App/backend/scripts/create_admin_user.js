// Script to create a new admin user
// Usage: node scripts/create_admin_user.js <username> <email> <password>
// Example: node scripts/create_admin_user.js admin2 admin2@example.com admin2password

import bcrypt from 'bcrypt';
import User from '../src/models/User.js';
import sequelize from '../src/config/database.js';
import { Op } from 'sequelize';

const username = process.argv[2] || 'admin2';
const email = process.argv[3] || 'admin2@example.com';
const password = process.argv[4] || 'admin2password';

async function createAdminUser() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✓ Database connection established.');

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      console.error(`✗ User with username '${username}' or email '${email}' already exists.`);
      process.exit(1);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const newUser = await User.create({
      username: username,
      email: email,
      password: hashedPassword,
      role: 'admin',
      created_at: new Date(),
      point_alerts_enabled: true,
    });

    console.log('\n=== Admin User Created Successfully ===');
    console.log('Username:', newUser.username);
    console.log('Email:', newUser.email);
    console.log('Role:', newUser.role);
    console.log('=======================================\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    await sequelize.close();
    process.exit(1);
  }
}

createAdminUser();
