const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: async (req, file) => {
      const clientId = req.body.client_id || 'unassigned';
      return `visualsaint/${clientId}`;
    },
    resource_type: async (req, file) => {
      if (file.originalname.match(/\.(zip|rar|7z|tar|gz)$/i)) {
        return 'raw';
      }
      return 'auto';
    }
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

module.exports = upload;
