const multer = require('multer');
const path = require('path');

// NOTE: This stores posters on local disk under /uploads/posters.
// To use Cloudinary instead: swap this storage engine for
// multer-storage-cloudinary and upload req.file.buffer to Cloudinary,
// then save the returned secure_url into movies.Poster.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', 'posters')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, or WEBP images are allowed.'));
}

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
