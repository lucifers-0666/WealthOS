/**
 * OCR service using Tesseract.js.
 * Extracts text from portfolio screenshots and broker app images.
 */

const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { parseHoldingsFromText } = require('./aiParserService');
const logger = require('../utils/logger');

/**
 * Pre-process image for better OCR accuracy.
 * Converts to grayscale, increases contrast.
 */
async function preprocessImage(inputPath) {
  const outputPath = inputPath.replace(/(\.[^.]+)$/, '_processed$1');
  await sharp(inputPath)
    .greyscale()
    .normalize()
    .sharpen()
    .toFile(outputPath);
  return outputPath;
}

/**
 * Extract holdings from an image file using OCR + AI parser.
 * @param {string} filePath
 * @returns {Promise<Array<Object>>}
 */
async function parseImage(filePath) {
  logger.info(`Starting OCR for ${path.basename(filePath)}`);

  let processedPath = filePath;
  try {
    processedPath = await preprocessImage(filePath);
  } catch (err) {
    logger.warn(`Image preprocessing failed, using original: ${err.message}`);
  }

  const { data: { text, confidence } } = await Tesseract.recognize(processedPath, 'eng', {
    logger: (m) => { if (m.status === 'recognizing text') logger.debug(`OCR progress: ${(m.progress * 100).toFixed(0)}%`); },
  });

  // Cleanup preprocessed file
  if (processedPath !== filePath && fs.existsSync(processedPath)) {
    fs.unlinkSync(processedPath);
  }

  logger.info(`OCR complete — confidence: ${confidence?.toFixed(1)}%`);

  if (!text || text.trim().length < 10) {
    throw new Error('OCR could not extract readable text from the image.');
  }

  // Use AI parser to extract structured holdings from OCR text
  const holdings = await parseHoldingsFromText(text);
  return holdings;
}

module.exports = { parseImage };
