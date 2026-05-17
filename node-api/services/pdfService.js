/**
 * PDF parsing service.
 * Extracts text from PDF and then uses AI parser to identify holdings.
 */

const fs = require('fs');
const pdfParse = require('pdf-parse');
const { parseHoldingsFromText } = require('./aiParserService');
const logger = require('../utils/logger');

/**
 * Parse a PDF file and return an array of holding objects.
 * @param {string} filePath
 * @returns {Promise<Array<Object>>}
 */
async function parsePDF(filePath) {
  const buffer = fs.readFileSync(filePath);

  let data;
  try {
    data = await pdfParse(buffer);
  } catch (err) {
    throw new Error(`PDF read error: ${err.message}`);
  }

  const text = data.text || '';
  if (!text.trim()) throw new Error('PDF has no extractable text. Try uploading an image instead.');

  logger.debug(`PDF extracted ${text.length} characters from ${filePath}`);

  // Use AI parser to extract structured holdings from raw text
  const holdings = await parseHoldingsFromText(text);
  return holdings;
}

module.exports = { parsePDF };
