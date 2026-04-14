const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// GET /api/topics
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM topics ORDER BY sort_order ASC, name ASC');
    res.json(rows);
  } catch (err) {
    console.error('GET topics error:', err);
    res.status(500).json({ error: 'Onderwerpen ophalen mislukt.' });
  }
});

// POST /api/topics (any authenticated user)
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Naam is verplicht.' });
    }
    const { rows } = await db.query(
      'INSERT INTO topics (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Dit onderwerp bestaat al.' });
    }
    console.error('POST topic error:', err);
    res.status(500).json({ error: 'Onderwerp aanmaken mislukt.' });
  }
});

// PUT /api/topics/:id (admin only)
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Naam is verplicht.' });
    }
    const { rows } = await db.query(
      'UPDATE topics SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), parseInt(req.params.id)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Onderwerp niet gevonden.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT topic error:', err);
    res.status(500).json({ error: 'Onderwerp bewerken mislukt.' });
  }
});

// DELETE /api/topics/:id (admin only)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'DELETE FROM topics WHERE id = $1 RETURNING id',
      [parseInt(req.params.id)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Onderwerp niet gevonden.' });
    res.json({ message: 'Onderwerp verwijderd.' });
  } catch (err) {
    console.error('DELETE topic error:', err);
    res.status(500).json({ error: 'Onderwerp verwijderen mislukt.' });
  }
});

module.exports = router;
