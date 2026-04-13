const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/notifications
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
        n.*,
        u.first_name AS triggered_by_name,
        p.content AS post_content
       FROM notifications n
       JOIN users u ON n.triggered_by = u.id
       JOIN posts p ON n.post_id = p.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET notifications error:', err);
    res.status(500).json({ error: 'Meldingen ophalen mislukt.' });
  }
});

// PUT /api/notifications/read (mark all as read)
router.put('/read', auth, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ message: 'Alle meldingen gelezen.' });
  } catch (err) {
    console.error('PUT notifications/read error:', err);
    res.status(500).json({ error: 'Meldingen markeren mislukt.' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [parseInt(req.params.id), req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Melding niet gevonden.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT notifications/:id/read error:', err);
    res.status(500).json({ error: 'Melding markeren mislukt.' });
  }
});

module.exports = router;
