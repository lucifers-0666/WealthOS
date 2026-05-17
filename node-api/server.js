/**
 * WealthOS — Node.js Import Service
 * Handles file uploads: CSV, Excel, PDF, images (OCR)
 * Parses holdings data and syncs to Supabase.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const uploadMiddleware = require('./middleware/upload');
const importRoutes = require('./routes/importRoutes');
const validateRoutes = require('./routes/validateRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Ensure uploads dir exists ────────────────────────────────
const uploadsDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wealthos-import', version: '1.0.0' });
});

app.use('/api/import', importRoutes);
app.use('/api/validate', validateRoutes);

// ── Error Handling ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`WealthOS import service running on port ${PORT}`);
});

module.exports = app;
