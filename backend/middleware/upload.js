const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { ApiError } = require('./errorHandler');

const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  pdf: ['application/pdf'],
};

const ALL_ALLOWED = Object.values(ALLOWED_MIME_TYPES).flat();

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

function resolveCategory(mimeType) {
  return Object.keys(ALLOWED_MIME_TYPES).find((cat) => ALLOWED_MIME_TYPES[cat].includes(mimeType));
}

// Cloudinary resource_type: images use 'image', video/audio use 'video'
// (Cloudinary's own convention), PDFs are uploaded as 'raw'/'image' depending
// on whether inline preview is desired — we use 'image' so Cloudinary can
// still generate a browser-viewable URL for PDFs.
function resourceTypeFor(category) {
  if (category === 'video' || category === 'audio') return 'video';
  if (category === 'pdf') return 'image';
  return 'image';
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const category = resolveCategory(file.mimetype);
    return {
      folder: `mediavault/${req.user?.id || 'anonymous'}`,
      resource_type: resourceTypeFor(category),
      allowed_formats: undefined, // mimetype filtering handled by fileFilter below
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALL_ALLOWED.includes(file.mimetype)) {
    return cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

module.exports = { upload, resolveCategory, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES };
