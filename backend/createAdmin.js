require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const createAdmin = async () => {
  try {
    const client = await pool.connect();
    
    // Ensure table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('--- Create New Admin Account ---');
    
    rl.question('Enter Admin Email: ', async (email) => {
      rl.question('Enter Admin Password: ', async (password) => {
        try {
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(password, salt);
          
          await client.query('INSERT INTO admins (email, password_hash) VALUES ($1, $2)', [email, hash]);
          console.log(`\n✅ Success! Admin account created for: ${email}`);
          
          // Also update .env just in case
          console.log('\n(Note: If you want this to be your default login, make sure to update ADMIN_EMAIL and ADMIN_PASSWORD in your .env file too)');
        } catch (err) {
          if(err.code === '23505') {
            console.log('\n❌ Error: An admin with this email already exists.');
          } else {
            console.error('\n❌ Error creating admin:', err.message);
          }
        } finally {
          client.release();
          pool.end();
          rl.close();
        }
      });
    });

  } catch (err) {
    console.error('Database connection error:', err);
    pool.end();
    rl.close();
  }
};

createAdmin();
