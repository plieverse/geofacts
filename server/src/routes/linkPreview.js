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

    const { result, error } = await ogs({
      url,
      timeout: 10000,
      fetchOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
        },
      },
    });

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
