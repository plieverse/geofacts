const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

// POST /api/auth/login
// Login with just first name (creates user if not exists)
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

    // Upsert user
    const { rows } = await db.query(
      `INSERT INTO users (first_name, is_admin)
       VALUES ($1, $2)
       ON CONFLICT (LOWER(first_name)) DO UPDATE
         SET is_admin = CASE WHEN EXCLUDED.is_admin THEN EXCLUDED.is_admin ELSE users.is_admin END
       RETURNING *`,
      [trimmedName, isAdmin]
    );

    const user = rows[0];

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
