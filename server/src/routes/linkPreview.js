const express = require('express');
const router = express.Router();
const ogs = require('open-graph-scraper');

// POST /api/link-preview
router.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is verplicht.' });
    }

    const { result, error } = await ogs({ url, timeout: 5000 });

    if (error) {
      return res.status(422).json({ error: 'Kon geen voorvertoning laden voor deze URL.' });
    }

    const preview = {
      title: result.ogTitle || result.twitterTitle || result.dcTitle || null,
      description: result.ogDescription || result.twitterDescription || null,
      image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
      url: result.requestUrl || url,
    };

    res.json(preview);
  } catch (err) {
    console.error('Link preview error:', err);
    res.status(500).json({ error: 'Voorvertoning ophalen mislukt.' });
  }
});

module.exports = router;
