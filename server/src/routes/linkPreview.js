const express = require('express');
const router = express.Router();
const ogs = require('open-graph-scraper');

async function fetchWithMicrolink(url) {
  const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=false`);
  if (!response.ok) return null;
  const data = await response.json();
  if (data.status !== 'success') return null;
  return {
    title: data.data.title || null,
    description: data.data.description || null,
    image: data.data.image?.url || null,
    url: data.data.url || url,
  };
}

async function fetchWithOgs(url) {
  const { result, error } = await ogs({
    url,
    timeout: 10000,
    fetchOptions: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    },
  });
  if (error) return null;
  return {
    title: result.ogTitle || result.twitterTitle || null,
    description: result.ogDescription || result.twitterDescription || null,
    image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
    url: result.requestUrl || url,
  };
}

// POST /api/link-preview
router.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is verplicht.' });
    }

    // Probeer eerst Microlink (werkt met NYT, BBC, etc.), daarna OGS als fallback
    let preview = await fetchWithMicrolink(url);
    if (!preview?.title) {
      preview = await fetchWithOgs(url);
    }

    if (!preview) {
      return res.status(422).json({ error: 'Kon geen voorvertoning laden voor deze URL.' });
    }

    res.json(preview);
  } catch (err) {
    console.error('Link preview error:', err);
    res.status(500).json({ error: 'Voorvertoning ophalen mislukt.' });
  }
});

module.exports = router;
