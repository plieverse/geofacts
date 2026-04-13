const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/push/vapid-public-key
router.get('/vapid-public-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(503).json({ error: 'Push notificaties zijn niet geconfigureerd.' });
  }
  res.json({ publicKey });
});

// POST /api/push/subscribe
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Ongeldige subscription data.' });
    }

    await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = $1, p256dh = $3, auth = $4`,
      [req.user.id, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
    );

    res.json({ message: 'Push abonnement opgeslagen.' });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Abonneren mislukt.' });
  }
});

// DELETE /api/push/unsubscribe
router.delete('/unsubscribe', auth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await db.query(
        'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
        [req.user.id, endpoint]
      );
    } else {
      await db.query('DELETE FROM push_subscriptions WHERE user_id = $1', [req.user.id]);
    }
    res.json({ message: 'Push abonnement verwijderd.' });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({ error: 'Afmelden mislukt.' });
  }
});

module.exports = router;
