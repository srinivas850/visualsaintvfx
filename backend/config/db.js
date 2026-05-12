const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const initDB = async () => {
  try {
    const client = await pool.connect();
    
    // Create admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create clients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        client_id VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create media table
    await client.query(`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        cloudinary_public_id VARCHAR(255) NOT NULL,
        secure_url TEXT NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        original_filename VARCHAR(255),
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
    
    // Check if admin exists, if not, create one
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const adminRes = await client.query('SELECT * FROM admins WHERE email = $1', [process.env.ADMIN_EMAIL]);
      if (adminRes.rows.length === 0) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
        await client.query('INSERT INTO admins (email, password_hash) VALUES ($1, $2)', [process.env.ADMIN_EMAIL, hash]);
        console.log('Default admin account created from environment variables');
      }
    }

    client.release();
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  initDB
};
