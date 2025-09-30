// App/backend/hashPassword.js
import bcrypt from 'bcrypt';

const password = process.argv[2] || 'password1';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  console.log('\n=== Password Hash Generated ===');
  console.log('Original password:', password);
  console.log('Hashed password:', hash);
  console.log('\nSQL UPDATE command:');
  console.log(UPDATE users SET password = '${hash}' WHERE username = 'admin1';);
  console.log('===============================\n');
});