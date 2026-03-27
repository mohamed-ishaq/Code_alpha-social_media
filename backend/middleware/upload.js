const multer = require('multer');

const parseMaxFileSize = () => {
  const fromEnv = Number(process.env.MAX_FILE_SIZE);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  // 5MB default
  return 5 * 1024 * 1024;
};

const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    const err = new Error('Only image uploads are allowed.');
    err.statusCode = 400;
    return cb(err, false);
  }
  cb(null, true);
};

const uploadPostImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseMaxFileSize(), files: 4 },
  fileFilter: imageFileFilter,
}).array('images', 4);

module.exports = { uploadPostImages };

