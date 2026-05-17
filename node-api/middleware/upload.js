/**
 * Multer upload middleware.
 * Accepts CSV, Excel (.xlsx/.xls), PDF, and images (PNG/JPG/WEBP).
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadsDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_MIMETYPES = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/tiff',
]);

const ALLOWED_EXTENSIONS = new Set(['.csv', '.xlsx', '.xls', '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.tiff']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${unique}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIMETYPES.has(file.mimetype) || ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', `Unsupported file type: ${ext}`));
  }
}

const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMB * 1024 * 1024 },
});

// Handle multer-specific errors cleanly
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: true, message: `File too large. Max size: ${maxSizeMB}MB` });
    }
    return res.status(400).json({ error: true, message: err.message });
  }
  next(err);
}

module.exports = { upload, handleMulterError };
