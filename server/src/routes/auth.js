const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { firstName } = req.body;
    if (!firstName || typeof firstName !== 'string') {
      return res.status(400).json({ error: 'Voornaam is verplicht.' });
    }

    const trimmedName = firstName.trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({ error: 'Voornaam moet tussen 2 en 50 tekens zijn.' });
    }

    const isAdmin = trimmedName.toLowerCase() === 'geoadmin';

    let user;

    if (isAdmin) {
      // GeoAdmin: altijd toegang, aanmaken als die nog niet bestaat
      const { rows } = await db.query(
        `INSERT INTO users (first_name, is_admin, is_approved)
         VALUES ($1, TRUE, TRUE)
         ON CONFLICT (LOWER(first_name)) DO UPDATE
           SET is_admin = TRUE, is_approved = TRUE
         RETURNING *`,
        [trimmedName]
      );
      user = rows[0];
    } else {
      // Gewone gebruiker: alleen toegang als GeoAdmin die heeft toegevoegd
      const { rows } = await db.query(
        `SELECT * FROM users WHERE LOWER(first_name) = LOWER($1)`,
        [trimmedName]
      );

      if (!rows.length || !rows[0].is_approved) {
        return res.status(403).json({
          error: 'Je naam staat niet op de toegangslijst.',
        });
      }

      user = rows[0];
    }

    const token = jwt.sign(
      {
        id: user.id,
        firstName: user.first_name,
        is_admin: user.is_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        is_admin: user.is_admin,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Inloggen mislukt.' });
  }
});

module.exports = router;
