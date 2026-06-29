const db = require('../config/db');

// Get all available services
const getServices = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM services ORDER BY created_at ASC');
    res.json({ success: true, services: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Validate promo code
const validatePromoCode = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Promo code is required' });
  }

  try {
    const result = await db.query('SELECT * FROM promo_codes WHERE code = $1', [code]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid promo code' });
    }

    const promo = result.rows[0];
    
    if (!promo.is_active) {
      return res.status(400).json({ success: false, message: 'Promo code is inactive' });
    }
    
    if (promo.expiry_date && new Date() > new Date(promo.expiry_date)) {
      return res.status(400).json({ success: false, message: 'Promo code has expired' });
    }

    if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
      return res.status(400).json({ success: false, message: 'Promo code usage limit reached' });
    }

    res.json({ 
      success: true, 
      discount_percentage: promo.discount_percentage,
      promo_code_id: promo.id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Submit a new booking
const submitBooking = async (req, res) => {
  const { 
    customer_name, email, phone, company_name, services, 
    promo_code_id, discount_percentage, subtotal, 
    discount_amount, gst_amount, final_amount 
  } = req.body;

  try {
    // Basic validation
    if (!customer_name || !email || !phone || !services || services.length === 0) {
      return res.status(400).json({ success: false, message: 'Required fields are missing' });
    }

    // Generate Invoice Number (e.g., VS-INV-1001-TIMESTAMP)
    const invoiceNumber = `VS-INV-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-6)}`;

    // Begin transaction
    await db.query('BEGIN');

    // Insert booking
    const result = await db.query(
      `INSERT INTO bookings (
        invoice_number, customer_name, email, phone, company_name, 
        services, promo_code_id, discount_percentage, subtotal, 
        discount_amount, gst_amount, final_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        invoiceNumber, customer_name, email, phone, company_name || null, 
        JSON.stringify(services), promo_code_id || null, discount_percentage || 0, 
        subtotal, discount_amount, gst_amount, final_amount
      ]
    );

    // If promo code was used, increment used_count
    if (promo_code_id) {
      await db.query('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1', [promo_code_id]);
    }

    await db.query('COMMIT');
    
    res.status(201).json({ success: true, booking: result.rows[0], invoice_number: invoiceNumber });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Server error while submitting booking', error: error.message });
  }
};

module.exports = {
  getServices,
  validatePromoCode,
  submitBooking
};
