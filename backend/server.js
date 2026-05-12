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

// Middleware
app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// Initialize Database
initDB();

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
