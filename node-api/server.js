/**
 * WealthOS — Node.js Import Service
 *
 * .env loading order:
 *   1. Root project .env  (D:\wealthOS\WealthOS\.env)  — shared keys
 *   2. node-api/.env                                   — local overrides
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');

const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const importRoutes = require('./routes/importRoutes');
const validateRoutes = require('./routes/validateRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

const uploadsDir = path.resolve(__dirname, process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wealthos-import', version: '1.0.0', port: PORT });
});

app.use('/api/import', importRoutes);
app.use('/api/validate', validateRoutes);

app.use(notFound);
app.use(errorHandler);

const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

app.listen(PORT, () => {
  logger.info(`WealthOS import service → http://localhost:${PORT}`);
  logger.info(`Environment : ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Supabase    : ${process.env.SUPABASE_URL ? '✓ connected' : '✗ SUPABASE_URL missing'}`);
  logger.info(`Gemini AI   : ${geminiKey ? '✓ key found' : '✗ GEMINI_API_KEY missing (regex fallback active)'}`);
});

module.exports = app;
