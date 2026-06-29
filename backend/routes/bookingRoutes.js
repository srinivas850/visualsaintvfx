const express = require('express');
const router = express.Router();
const { 
  getServices, 
  validatePromoCode, 
  submitBooking 
} = require('../controllers/bookingController');

router.get('/services', getServices);
router.post('/promo/validate', validatePromoCode);
router.post('/submit', submitBooking);

module.exports = router;
