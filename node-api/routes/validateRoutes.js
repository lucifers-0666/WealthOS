/**
 * Validation API routes.
 * POST /api/validate/symbols — validate an array of ticker symbols
 * GET  /api/validate/symbol/:ticker — validate a single ticker
 */

const express = require('express');
const { validateHolding, validateHoldings } = require('../services/stockValidatorService');

const router = express.Router();

// POST /api/validate/symbols
router.post('/symbols', express.json(), async (req, res, next) => {
  const { holdings } = req.body;
  if (!Array.isArray(holdings) || holdings.length === 0) {
    return res.status(400).json({ error: true, message: 'Body must contain { holdings: [...] }' });
  }
  try {
    const result = await validateHoldings(holdings);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/validate/symbol/:ticker
router.get('/symbol/:ticker', async (req, res, next) => {
  const { ticker } = req.params;
  const exchange = req.query.exchange || 'NSE';
  try {
    const result = await validateHolding({ ticker, exchange });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
