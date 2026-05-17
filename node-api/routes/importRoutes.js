/**
 * Import API routes.
 * POST /api/import/upload — upload and parse a portfolio file
 * POST /api/import/text  — parse raw text (e.g. pasted broker data)
 */

const express = require('express');
const path = require('path');
const { upload, handleMulterError } = require('../middleware/upload');
const { processImport } = require('../services/importService');
const { parseHoldingsFromText } = require('../services/aiParserService');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/import/upload
router.post(
  '/upload',
  upload.single('file'),
  handleMulterError,
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'No file uploaded. Use field name: file' });
    }

    const skipValidation = req.query.skipValidation === 'true';

    try {
      const result = await processImport(req.file.path, { skipValidation });
      res.json({
        success: true,
        fileType: result.fileType,
        summary: result.summary,
        holdings: result.validated.valid,
        warnings: result.validated.warnings,
        rejected: result.validated.invalid,
      });
    } catch (err) {
      logger.error(`Import failed: ${err.message}`);
      next(err);
    }
  }
);

// POST /api/import/text
router.post('/text', express.json(), async (req, res, next) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: true, message: 'Body must contain { text: string }' });
  }
  try {
    const holdings = await parseHoldingsFromText(text);
    res.json({ success: true, holdings, count: holdings.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
