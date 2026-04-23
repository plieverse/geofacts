const express = require('express');
const router = express.Router();

// GET /api/view-file?url=<cloudinary_url>
// Publiek endpoint — serveert Cloudinary-bestanden inline (zonder download-header)
router.get('/', async (req, res) => {
  try {
    const { url } = req.query;

    // Alleen Cloudinary-URL's toestaan
    if (!url || !url.startsWith('https://res.cloudinary.com/')) {
      return res.status(400).send('Ongeldige URL.');
    }

    const upstream = await fetch(url);
    if (!upstream.ok) {
      return res.status(upstream.status).send('Bestand niet gevonden.');
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('View file error:', err);
    res.status(500).send('Bestand laden mislukt.');
  }
});

module.exports = router;
