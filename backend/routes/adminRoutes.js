const express = require('express');
const router = express.Router();
const { 
  loginAdmin, 
  getStats, 
  createClient, 
  getClients, 
  deleteClient,
  uploadMedia,
  deleteMedia
} = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Auth
router.post('/login', loginAdmin);

// Dashboard
router.get('/stats', protectAdmin, getStats);

// Clients
router.get('/clients', protectAdmin, getClients);
router.post('/clients', protectAdmin, createClient);
router.delete('/clients/:id', protectAdmin, deleteClient);

// Media
router.post('/upload', protectAdmin, upload.array('files', 50), uploadMedia);
router.delete('/media/:id', protectAdmin, deleteMedia);

module.exports = router;
