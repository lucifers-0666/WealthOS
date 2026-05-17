/**
 * WealthOS — Node.js Import Service
 * Handles file uploads: CSV, Excel, PDF, images (OCR)
 * Parses holdings data and syncs to Supabase.
 *
 * .env loading order:
 *   1. Root project .env  (D:\wealthOS\WealthOS\.env)  — shared keys
 *   2. node-api/.env                                   — local overrides
 */

const path = require('path');

// Load ROOT .env first so SUPABASE_URL, OPENAI_API_KEY etc. are available
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
// Then load local node-api/.env (can override PORT etc.)
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

// ── Ensure uploads dir exists ────────────────────────────────
const uploadsDir = path.resolve(__dirname, process.env.UPLOAD_DIR || './uploads');
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
  res.json({ status: 'ok', service: 'wealthos-import', version: '1.0.0', port: PORT });
});

app.use('/api/import', importRoutes);
app.use('/api/validate', validateRoutes);

// ── Error Handling ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`WealthOS import service running → http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Supabase: ${process.env.SUPABASE_URL ? '✓ connected' : '✗ SUPABASE_URL missing'}`);
  logger.info(`OpenAI: ${process.env.OPENAI_API_KEY ? '✓ key found' : '✗ OPENAI_API_KEY missing (AI parser disabled)'}`);
});

module.exports = app;
