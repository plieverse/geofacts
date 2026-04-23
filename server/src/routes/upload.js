const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const auth = require('../middleware/auth');

// Cloudinary configuratie
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Bestandstype niet toegestaan. Gebruik afbeeldingen (JPEG, PNG, GIF, WEBP) of PDF.'));
    }
  },
});

function uploadToCloudinary(buffer, mimetype, originalname) {
  return new Promise((resolve, reject) => {
    const isPdf = mimetype === 'application/pdf';
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: isPdf ? 'raw' : 'image',
        folder: 'geofacts',
        // Bewaart de originele bestandsnaam (incl. .pdf extensie) zodat
        // Cloudinary het juiste Content-Type kan bepalen
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// POST /api/upload
router.post('/', auth, (req, res, next) => {
  // Multer foutafhandeling inline zodat we nette JSON kunnen sturen
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Bestand is te groot (max. 10 MB).' });
      }
      return res.status(400).json({ error: 'Uploadfout: ' + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Geen bestand ontvangen.' });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(503).json({ error: 'Bestandsupload niet geconfigureerd (Cloudinary ontbreekt).' });
    }

    const { buffer, mimetype, originalname, size } = req.file;
    const result = await uploadToCloudinary(buffer, mimetype, originalname);

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      filename: originalname,
      fileType: mimetype,
      fileSize: size,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Uploaden mislukt.' });
  }
});

module.exports = router;
