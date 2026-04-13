const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');
const auth = require('../middleware/auth');
const { createCommentNotification } = require('../services/notificationService');

// GET /api/posts/:id/comments
router.get('/', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { rows } = await db.query(
      `SELECT c.*, u.first_name FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET comments error:', err);
    res.status(500).json({ error: 'Reacties ophalen mislukt.' });
  }
});

// POST /api/posts/:id/comments
router.post('/', auth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Reactie mag niet leeg zijn.' });
    }

    // Check post exists
    const { rows: postRows } = await db.query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (!postRows.length) return res.status(404).json({ error: 'Bericht niet gevonden.' });

    const { rows } = await db.query(
      `INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [postId, req.user.id, content.trim()]
    );

    const comment = rows[0];

    // Get first_name for response
    const { rows: userRows } = await db.query('SELECT first_name FROM users WHERE id = $1', [req.user.id]);
    comment.first_name = userRows[0]?.first_name;

    // Create notification asynchronously
    createCommentNotification(postId, req.user.id).catch(console.error);

    res.status(201).json(comment);
  } catch (err) {
    console.error('POST comment error:', err);
    res.status(500).json({ error: 'Reactie plaatsen mislukt.' });
  }
});

module.exports = router;
