const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { initDB } = require('./config/db');

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const clientRoutes = require('./routes/clientRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ─────────────────────────────────────────────────────────────────────
// Must come BEFORE helmet so that preflight OPTIONS requests are answered
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false   // must be false when origin is '*'
};
app.use(cors(corsOptions));
app.options('/*path', cors(corsOptions)); // handle all pre-flight OPTIONS requests

// ── Helmet (security headers) ────────────────────────────────────────────────
// Disable contentSecurityPolicy so external Cloudinary/CDN assets are not blocked
app.use(helmet({ contentSecurityPolicy: false }));

// ── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev')); // Logging

// Serve static frontend files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// ── Health / Keep-Alive endpoint ─────────────────────────────────────────────
// Pinging this prevents Render free tier from sleeping
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Initialize Database ───────────────────────────────────────────────────────
initDB();

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);

// ── Global Error Handling ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

