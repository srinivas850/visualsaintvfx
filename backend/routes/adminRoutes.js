const express = require('express');
const router = express.Router();
const { 
  loginAdmin, 
  getStats, 
  createClient, 
  getClients, 
  deleteClient,
  uploadMedia,
  deleteMedia,
  getServices,
  createService,
  updateService,
  deleteService,
  getPromoCodes,
  createPromoCode,
  togglePromoCode,
  deletePromoCode,
  getBookings,
  deleteBooking
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

// Services
router.get('/services', protectAdmin, getServices);
router.post('/services', protectAdmin, createService);
router.put('/services/:id', protectAdmin, updateService);
router.delete('/services/:id', protectAdmin, deleteService);

// Promo Codes
router.get('/promo-codes', protectAdmin, getPromoCodes);
router.post('/promo-codes', protectAdmin, createPromoCode);
router.put('/promo-codes/:id', protectAdmin, togglePromoCode);
router.delete('/promo-codes/:id', protectAdmin, deletePromoCode);

// Bookings
router.get('/bookings', protectAdmin, getBookings);
router.delete('/bookings/:id', protectAdmin, deleteBooking);

module.exports = router;
