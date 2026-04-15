const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');
const auth = require('../middleware/auth');
const { createCommentNotification, createCommentLikeNotification } = require('../services/notificationService');

// GET /api/posts/:id/comments
router.get('/', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    // Optionele auth voor user_liked
    let currentUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        currentUserId = decoded.id;
      } catch (_) {}
    }

    const { rows } = await db.query(
      `SELECT
         c.*,
         u.first_name,
         COUNT(DISTINCT cl.id)::int AS like_count,
         ${currentUserId
           ? `BOOL_OR(cl2.user_id = ${currentUserId}) AS user_liked`
           : 'FALSE AS user_liked'}
       FROM comments c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN comment_likes cl  ON cl.comment_id  = c.id
       ${currentUserId
         ? `LEFT JOIN comment_likes cl2 ON cl2.comment_id = c.id AND cl2.user_id = ${currentUserId}`
         : ''}
       WHERE c.post_id = $1
       GROUP BY c.id, u.first_name
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

    const { rows: postRows } = await db.query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (!postRows.length) return res.status(404).json({ error: 'Bericht niet gevonden.' });

    const { rows } = await db.query(
      `INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [postId, req.user.id, content.trim()]
    );

    const comment = rows[0];
    const { rows: userRows } = await db.query('SELECT first_name FROM users WHERE id = $1', [req.user.id]);
    comment.first_name = userRows[0]?.first_name;
    comment.like_count = 0;
    comment.user_liked = false;

    createCommentNotification(postId, req.user.id).catch(console.error);

    res.status(201).json(comment);
  } catch (err) {
    console.error('POST comment error:', err);
    res.status(500).json({ error: 'Reactie plaatsen mislukt.' });
  }
});

// POST /api/posts/:id/comments/:commentId/like  (toggle, postId niet gebruikt maar nodig voor routing)
router.post('/:commentId/like', auth, async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const userId = req.user.id;

    const { rows: existing } = await db.query(
      'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      [commentId, userId]
    );

    let liked;
    if (existing.length) {
      await db.query('DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, userId]);
      liked = false;
    } else {
      await db.query('INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)', [commentId, userId]);
      liked = true;
      createCommentLikeNotification(commentId, userId).catch(console.error);
    }

    const { rows: countRows } = await db.query(
      'SELECT COUNT(*)::int AS like_count FROM comment_likes WHERE comment_id = $1',
      [commentId]
    );

    res.json({ liked, like_count: countRows[0].like_count });
  } catch (err) {
    console.error('POST comment like error:', err);
    res.status(500).json({ error: 'Like mislukt.' });
  }
});

module.exports = router;
