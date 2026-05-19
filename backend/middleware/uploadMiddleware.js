const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const clientId = req.body.client_id || 'unassigned';

    // Determine Cloudinary resource_type from the file's mimetype
    let resource_type = 'auto';
    if (file.originalname.match(/\.(zip|rar|7z|tar|gz)$/i)) {
      resource_type = 'raw';
    }

    return {
      folder: `visualsaint/${clientId}`,
      resource_type: resource_type,
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
    };
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

module.exports = upload;
