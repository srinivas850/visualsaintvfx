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
    resource_type: 'auto',
    public_id: (req, file) => {
      return `${Date.now()}-${file.originalname.split('.')[0]}`;
    }
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos and high-res images
  }
});

module.exports = upload;
