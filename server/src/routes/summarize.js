const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Dagelijkse limiet bijhouden (in-memory, reset bij server-herstart)
let dailyTracker = { date: '', count: 0 };

function checkDailyLimit() {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyTracker.date !== today) {
    dailyTracker = { date: today, count: 0 };
  }
  if (dailyTracker.count >= 20) return false;
  dailyTracker.count++;
  return true;
}

function extractYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] || null;
}

async function extractYouTubeText(videoId) {
  const { YoutubeTranscript } = require('youtube-transcript');
  const transcript = await YoutubeTranscript.fetchTranscript(videoId);
  if (!transcript || transcript.length === 0) {
    throw new Error('Geen transcript beschikbaar');
  }
  return transcript
    .map((t) => t.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 10000);
}

async function extractArticleText(url) {
  const cheerio = require('cheerio');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; GeoFacts/1.0; +https://geofacts.nl)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timer);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/pdf')) {
      // Redirect to PDF handler
      throw new Error('IS_PDF');
    }
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error('Ongeldig inhoudstype: ' + contentType.split(';')[0]);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Verwijder ruis
    $(
      'script, style, nav, header, footer, aside, .ad, .ads, .advertisement, ' +
      '.cookie-banner, .cookie-notice, .paywall, .subscribe, .newsletter, ' +
      '[aria-hidden="true"], .sidebar, .related, .comments'
    ).remove();

    // Probeer hoofd-content te vinden
    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '.article-body',
      '.article__body',
      '.post-content',
      '.entry-content',
      '.story-body',
      '.article-content',
      '#article-body',
      '#content',
    ];

    let text = '';
    for (const sel of selectors) {
      const el = $(sel).first();
      if (el.length) {
        const candidate = el.text().replace(/\s+/g, ' ').trim();
        if (candidate.length > 300) {
          text = candidate;
          break;
        }
      }
    }

    // Fallback: alle paragrafen samenvoegen
    if (text.length < 300) {
      text = $('p')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((t) => t.length > 40)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    return text.slice(0, 10000);
  } finally {
    clearTimeout(timer);
  }
}

async function extractPdfText(url) {
  const pdfParse = require('pdf-parse');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdfParse(buffer, { max: 5 }); // max 5 pages
    return data.text.replace(/\s+/g, ' ').trim().slice(0, 10000);
  } finally {
    clearTimeout(timer);
  }
}

// POST /api/summarize
router.post('/', auth, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'URL is verplicht.' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Samenvatting-service niet geconfigureerd.' });
    }

    if (!checkDailyLimit()) {
      return res.status(429).json({
        error: 'Dagelijkse limiet van 20 samenvattingen bereikt. Probeer morgen opnieuw.',
      });
    }

    const trimmedUrl = url.trim();
    let text = '';
    let sourceType = 'article';

    // Detecteer URL-type
    const youtubeId = extractYouTubeId(trimmedUrl);
    const looksLikePdf = /\.pdf(\?|#|$)/i.test(trimmedUrl);

    if (youtubeId) {
      sourceType = 'youtube';
      try {
        text = await extractYouTubeText(youtubeId);
      } catch (err) {
        // Decrement counter because we didn't use the API
        dailyTracker.count = Math.max(0, dailyTracker.count - 1);
        return res.status(422).json({
          error: 'Transcript niet beschikbaar voor deze video (ondertiteling uitgeschakeld of privé).',
        });
      }
    } else if (looksLikePdf) {
      sourceType = 'pdf';
      try {
        text = await extractPdfText(trimmedUrl);
      } catch (err) {
        dailyTracker.count = Math.max(0, dailyTracker.count - 1);
        return res.status(422).json({ error: 'PDF kon niet worden gelezen.' });
      }
    } else {
      try {
        text = await extractArticleText(trimmedUrl);
      } catch (err) {
        if (err.message === 'IS_PDF') {
          sourceType = 'pdf';
          try {
            text = await extractPdfText(trimmedUrl);
          } catch {
            dailyTracker.count = Math.max(0, dailyTracker.count - 1);
            return res.status(422).json({ error: 'PDF kon niet worden gelezen.' });
          }
        } else {
          dailyTracker.count = Math.max(0, dailyTracker.count - 1);
          return res.status(422).json({
            error: 'Artikel kon niet worden gelezen (mogelijk achter een betaalmuur of geblokkeerd).',
          });
        }
      }
    }

    if (!text || text.length < 100) {
      dailyTracker.count = Math.max(0, dailyTracker.count - 1);
      return res.status(422).json({
        error: 'Onvoldoende tekst gevonden om samen te vatten.',
      });
    }

    // Roep Anthropic API aan
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    const systemPrompt =
      'Je bent een assistent die beknopte, informatieve samenvattingen schrijft in het Nederlands. ' +
      'Schrijf in heldere, objectieve taal. Geen bullet points, gewoon lopende tekst. Maximaal 3 zinnen.';

    const userPrompt =
      sourceType === 'youtube'
        ? `Geef een beknopte samenvatting van dit YouTube-videotranscript:\n\n${text}`
        : sourceType === 'pdf'
        ? `Geef een beknopte samenvatting van dit PDF-document:\n\n${text}`
        : `Geef een beknopte samenvatting van dit artikel:\n\n${text}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const summary = message.content[0]?.text?.trim();
    if (!summary) {
      return res.status(500).json({ error: 'Samenvatting genereren mislukt.' });
    }

    res.json({ summary, sourceType });
  } catch (err) {
    // Decrement on unexpected error
    dailyTracker.count = Math.max(0, dailyTracker.count - 1);
    console.error('POST /summarize error:', err);
    res.status(500).json({ error: 'Samenvatting genereren mislukt.' });
  }
});

module.exports = router;
