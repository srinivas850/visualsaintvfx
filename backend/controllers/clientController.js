const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const loginClient = async (req, res) => {
  const { client_id, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM clients WHERE client_id = $1', [client_id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const client = result.rows[0];
    const isMatch = await bcrypt.compare(password, client.password_hash);

    if (isMatch) {
      res.json({
        success: true,
        token: generateToken(client.id, 'client'),
        client: { id: client.id, client_id: client.client_id, name: client.name }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getGallery = async (req, res) => {
  const clientId = req.client.id; // from auth middleware
  try {
    const result = await db.query('SELECT id, secure_url, file_type, original_filename, upload_date FROM media WHERE client_id = $1 ORDER BY upload_date DESC', [clientId]);
    res.json({ success: true, files: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  loginClient,
  getGallery
};
