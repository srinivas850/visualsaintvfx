const express = require('express');
const router = express.Router();
const { loginClient, getGallery } = require('../controllers/clientController');
const { protectClient } = require('../middleware/authMiddleware');

router.post('/login', loginClient);
router.get('/gallery', protectClient, getGallery);

module.exports = router;
