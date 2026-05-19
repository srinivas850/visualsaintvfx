const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const setup = async () => {
    try {
        const res = await db.query("INSERT INTO clients (client_id, name, password_hash) VALUES ('test_client', 'Test Client', 'hash') RETURNING id;");
        console.log('Created client with ID:', res.rows[0].id);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

setup();
