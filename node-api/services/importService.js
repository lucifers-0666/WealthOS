/**
 * Import Service — orchestrates the full import pipeline:
 * detect file type → parse → validate → return structured holdings.
 */

const path = require('path');
const fs = require('fs');
const { parseCSV } = require('./csvService');
const { parseExcel } = require('./excelService');
const { parsePDF } = require('./pdfService');
const { parseImage } = require('./ocrService');
const { validateHoldings } = require('./stockValidatorService');
const logger = require('../utils/logger');

const FILE_TYPE_MAP = {
  '.csv': 'csv',
  '.xlsx': 'excel',
  '.xls': 'excel',
  '.pdf': 'pdf',
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.webp': 'image',
  '.tiff': 'image',
};

/**
 * Process an uploaded file end-to-end.
 * @param {string} filePath - absolute or relative path to the uploaded file
 * @param {{ skipValidation?: boolean }} options
 * @returns {Promise<{ fileType, raw, validated, summary }>}
 */
async function processImport(filePath, options = {}) {
  const ext = path.extname(filePath).toLowerCase();
  const fileType = FILE_TYPE_MAP[ext];

  if (!fileType) {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  logger.info(`Processing ${fileType} import: ${path.basename(filePath)}`);

  let rawHoldings;
  try {
    switch (fileType) {
      case 'csv':   rawHoldings = parseCSV(filePath);         break;
      case 'excel': rawHoldings = parseExcel(filePath);       break;
      case 'pdf':   rawHoldings = await parsePDF(filePath);   break;
      case 'image': rawHoldings = await parseImage(filePath); break;
    }
  } catch (err) {
    throw new Error(`Parse error (${fileType}): ${err.message}`);
  }

  logger.info(`Parsed ${rawHoldings.length} raw holdings from ${fileType}`);

  // Optionally skip Yahoo Finance validation (faster, for trusted CSVs)
  if (options.skipValidation) {
    return {
      fileType,
      raw: rawHoldings,
      validated: { valid: rawHoldings, invalid: [], warnings: [] },
      summary: { total: rawHoldings.length, valid: rawHoldings.length, invalid: 0, warnings: 0 },
    };
  }

  const validated = await validateHoldings(rawHoldings);
  logger.info(`Validation: ${validated.valid.length} valid, ${validated.invalid.length} invalid, ${validated.warnings.length} warnings`);

  // Cleanup uploaded file after processing
  try { fs.unlinkSync(filePath); } catch { /* ignore */ }

  return {
    fileType,
    raw: rawHoldings,
    validated,
    summary: {
      total: rawHoldings.length,
      valid: validated.valid.length,
      invalid: validated.invalid.length,
      warnings: validated.warnings.length,
    },
  };
}

module.exports = { processImport };
