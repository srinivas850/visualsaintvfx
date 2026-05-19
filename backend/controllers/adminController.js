const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const cloudinary = require('../config/cloudinary');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Admin Login
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (isMatch) {
      res.json({
        success: true,
        token: generateToken(admin.id, 'admin'),
        admin: { email: admin.email }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get Dashboard Stats
const getStats = async (req, res) => {
  try {
    const clientsCount = await db.query('SELECT COUNT(*) FROM clients');
    const uploadsCount = await db.query('SELECT COUNT(*) FROM media');
    const recentUploads = await db.query(`
      SELECT m.*, c.name as client_name 
      FROM media m 
      JOIN clients c ON m.client_id = c.id 
      ORDER BY m.upload_date DESC LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        totalClients: parseInt(clientsCount.rows[0].count),
        totalUploads: parseInt(uploadsCount.rows[0].count),
        recentUploads: recentUploads.rows
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Client Management
const createClient = async (req, res) => {
  const { client_id, password, name } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO clients (client_id, password_hash, name) VALUES ($1, $2, $3) RETURNING id, client_id, name',
      [client_id, hash, name]
    );

    res.status(201).json({ success: true, client: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating client', error: error.message });
  }
};

const getClients = async (req, res) => {
  try {
    const result = await db.query('SELECT id, client_id, name, created_at FROM clients ORDER BY created_at DESC');
    res.json({ success: true, clients: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteClient = async (req, res) => {
  const { id } = req.params;
  try {
    // Media will be deleted on cascade from db, but we need to delete from cloudinary first
    const mediaRes = await db.query('SELECT cloudinary_public_id FROM media WHERE client_id = $1', [id]);
    
    for (const file of mediaRes.rows) {
      try {
        await cloudinary.uploader.destroy(file.cloudinary_public_id);
      } catch (cloudinaryErr) {
        console.error('Failed to delete file from Cloudinary:', cloudinaryErr);
      }
    }

    await db.query('DELETE FROM clients WHERE id = $1', [id]);
    res.json({ success: true, message: 'Client and all associated files deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Media Management
const uploadMedia = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const client_id = req.body.client_id;
    if (!client_id) {
      return res.status(400).json({ success: false, message: 'Client ID is required' });
    }

    const savedMedia = [];
    for (const file of req.files) {
      // multer-storage-cloudinary v4 attaches public_id & secure_url (not filename/path)
      const publicId = file.public_id || file.filename;
      const secureUrl = file.secure_url || file.path;
      const result = await db.query(
        'INSERT INTO media (client_id, cloudinary_public_id, secure_url, file_type, original_filename) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [client_id, publicId, secureUrl, file.mimetype, file.originalname]
      );
      savedMedia.push(result.rows[0]);
    }

    res.status(201).json({ success: true, files: savedMedia });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload error', error: error.message });
  }
};

const deleteMedia = async (req, res) => {
  const { id } = req.params;
  try {
    const mediaRes = await db.query('SELECT cloudinary_public_id FROM media WHERE id = $1', [id]);
    if (mediaRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const publicId = mediaRes.rows[0].cloudinary_public_id;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch(err) {
      console.error('Cloudinary delete error:', err);
    }
    
    await db.query('DELETE FROM media WHERE id = $1', [id]);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  loginAdmin,
  getStats,
  createClient,
  getClients,
  deleteClient,
  uploadMedia,
  deleteMedia
};
