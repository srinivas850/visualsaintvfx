const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

/**
 * Cloudinary storage engine for multer v1 (1.4.5-lts.1).
 * multer-storage-cloudinary v4 requires multer v1 — do NOT upgrade multer to v2.
 *
 * params MUST be an async function returning a plain object (not nested keys).
 * resource_type: 'auto' lets Cloudinary detect image/video automatically.
 * resource_type: 'raw'  is required for non-media files (zip, pdf, etc.)
 */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const clientId = req.body.client_id || 'unassigned';

    // Sanitise filename for Cloudinary public_id (no dots/spaces/special chars)
    const baseName = file.originalname
      .replace(/\.[^/.]+$/, '')           // strip extension
      .replace(/[^a-zA-Z0-9_-]/g, '_')   // replace special chars
      .substring(0, 80);                  // cap length

    // Determine resource type
    let resourceType = 'auto';
    if (/\.(zip|rar|7z|tar|gz|pdf|doc|docx|xls|xlsx)$/i.test(file.originalname)) {
      resourceType = 'raw';
    }

    return {
      folder: `visualsaint/${clientId}`,
      resource_type: resourceType,
      public_id: `${Date.now()}-${baseName}`,
    };
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB per file
    files: 50,                    // max 50 files per request
  },
  fileFilter: (req, file, cb) => {
    // Reject hidden system files
    if (file.originalname.startsWith('.') || file.originalname === 'Thumbs.db') {
      return cb(null, false);
    }
    cb(null, true);
  },
});

module.exports = upload;
