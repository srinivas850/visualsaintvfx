const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const cloudinary = require('../config/cloudinary');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/**
 * Returns the Cloudinary resource_type based on a file's MIME type string.
 * This MUST match what was used during upload so Cloudinary can find the asset.
 */
function getCloudinaryResourceType(mimeType) {
  if (!mimeType) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  // audio, application/*, text/*, zip, pdf, etc.
  return 'raw';
}

/**
 * Safely destroy a file on Cloudinary. Tries the detected resource_type first;
 * if that returns 'not found', falls back to all other types before giving up.
 * Errors are logged but never thrown so that DB cleanup always continues.
 */
async function safeCloudinaryDelete(publicId, mimeType) {
  const primaryType = getCloudinaryResourceType(mimeType);
  const fallbacks = ['image', 'video', 'raw'].filter(t => t !== primaryType);
  const order = [primaryType, ...fallbacks];

  for (const resourceType of order) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      if (result.result === 'ok') {
        console.log(`[Cloudinary] Deleted ${publicId} as ${resourceType}`);
        return true;
      }
    } catch (err) {
      console.warn(`[Cloudinary] destroy failed for ${publicId} (${resourceType}): ${err.message}`);
    }
  }
  console.warn(`[Cloudinary] Could not delete ${publicId} — skipping, DB record will still be removed.`);
  return false;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const result = await db.query('SELECT * FROM admins WHERE LOWER(email) = LOWER($1)', [email.trim()]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log(`[Admin] Login success: ${admin.email}`);
    return res.json({
      success: true,
      token: generateToken(admin.id, 'admin'),
      admin: { email: admin.email }
    });
  } catch (error) {
    console.error('[Admin] Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const [clientsCount, uploadsCount, recentUploads] = await Promise.all([
      db.query('SELECT COUNT(*) FROM clients'),
      db.query('SELECT COUNT(*) FROM media'),
      db.query(`
        SELECT m.id, m.original_filename, m.file_type, m.upload_date, c.name AS client_name
        FROM media m
        JOIN clients c ON m.client_id = c.id
        ORDER BY m.upload_date DESC
        LIMIT 10
      `)
    ]);

    return res.json({
      success: true,
      stats: {
        totalClients: parseInt(clientsCount.rows[0].count, 10),
        totalUploads: parseInt(uploadsCount.rows[0].count, 10),
        recentUploads: recentUploads.rows
      }
    });
  } catch (error) {
    console.error('[Admin] getStats error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard stats' });
  }
};

// ─── Client Management ────────────────────────────────────────────────────────

const createClient = async (req, res) => {
  const { client_id, password, name } = req.body;

  if (!client_id || !password || !name) {
    return res.status(400).json({ success: false, message: 'Name, client_id and password are all required' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO clients (client_id, password_hash, name) VALUES ($1, $2, $3) RETURNING id, client_id, name',
      [client_id.trim(), hash, name.trim()]
    );

    console.log(`[Admin] Created client: ${client_id}`);
    return res.status(201).json({ success: true, client: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: `Client ID "${client_id}" already exists` });
    }
    console.error('[Admin] createClient error:', error.message);
    return res.status(500).json({ success: false, message: 'Error creating client account' });
  }
};

const getClients = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, client_id, name, created_at FROM clients ORDER BY created_at DESC'
    );
    return res.json({ success: true, clients: result.rows });
  } catch (error) {
    console.error('[Admin] getClients error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch clients' });
  }
};

const deleteClient = async (req, res) => {
  const { id } = req.params;
  const clientIdNum = parseInt(id, 10);

  if (isNaN(clientIdNum)) {
    return res.status(400).json({ success: false, message: 'Invalid client ID' });
  }

  try {
    // Fetch all media records for this client first
    const mediaRes = await db.query(
      'SELECT cloudinary_public_id, file_type FROM media WHERE client_id = $1',
      [clientIdNum]
    );

    // Delete each file from Cloudinary (errors are swallowed — DB is source of truth)
    for (const file of mediaRes.rows) {
      await safeCloudinaryDelete(file.cloudinary_public_id, file.file_type);
    }

    // Delete client (media rows cascade via FK constraint)
    const deleteRes = await db.query('DELETE FROM clients WHERE id = $1 RETURNING id', [clientIdNum]);

    if (deleteRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    console.log(`[Admin] Deleted client id=${clientIdNum} with ${mediaRes.rows.length} media files`);
    return res.json({
      success: true,
      message: `Client and ${mediaRes.rows.length} associated file(s) deleted`
    });
  } catch (error) {
    console.error('[Admin] deleteClient error:', error.message);
    return res.status(500).json({ success: false, message: 'Error deleting client', error: error.message });
  }
};

// ─── Media Management ─────────────────────────────────────────────────────────

const uploadMedia = async (req, res) => {
  try {
    console.log('[Upload] Request received. Files:', req.files ? req.files.length : 0);
    console.log('[Upload] Body:', JSON.stringify(req.body));

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const client_id = req.body.client_id;
    if (!client_id) {
      return res.status(400).json({ success: false, message: 'client_id is required' });
    }

    // Verify client exists
    const clientCheck = await db.query('SELECT id FROM clients WHERE id = $1', [client_id]);
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const savedMedia = [];
    for (const file of req.files) {
      console.log('[Upload] Processing file:', file.originalname, '| Keys:', Object.keys(file).join(', '));

      // multer-storage-cloudinary v4 attaches these fields to the file object
      const publicId  = file.public_id  || file.filename  || null;
      const secureUrl = file.secure_url || file.path      || null;

      if (!publicId || !secureUrl) {
        console.error('[Upload] Missing Cloudinary fields on file:', file);
        continue; // skip broken file rather than crashing the whole upload
      }

      const result = await db.query(
        `INSERT INTO media (client_id, cloudinary_public_id, secure_url, file_type, original_filename)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [client_id, publicId, secureUrl, file.mimetype, file.originalname]
      );
      savedMedia.push(result.rows[0]);
    }

    console.log(`[Upload] Saved ${savedMedia.length}/${req.files.length} files to DB`);
    return res.status(201).json({ success: true, files: savedMedia });
  } catch (error) {
    console.error('[Upload] uploadMedia error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Upload error', error: error.message });
  }
};

const deleteMedia = async (req, res) => {
  const { id } = req.params;
  const mediaIdNum = parseInt(id, 10);

  if (isNaN(mediaIdNum)) {
    return res.status(400).json({ success: false, message: 'Invalid media ID' });
  }

  try {
    const mediaRes = await db.query(
      'SELECT cloudinary_public_id, file_type FROM media WHERE id = $1',
      [mediaIdNum]
    );

    if (mediaRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const { cloudinary_public_id, file_type } = mediaRes.rows[0];
    await safeCloudinaryDelete(cloudinary_public_id, file_type);

    await db.query('DELETE FROM media WHERE id = $1', [mediaIdNum]);

    console.log(`[Admin] Deleted media id=${mediaIdNum} (${cloudinary_public_id})`);
    return res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('[Admin] deleteMedia error:', error.message);
    return res.status(500).json({ success: false, message: 'Error deleting file', error: error.message });
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
