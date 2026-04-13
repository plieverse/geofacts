const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');
const auth = require('../middleware/auth');
const { createLikeNotification } = require('../services/notificationService');

// POST /api/posts/:id/like  (toggle)
router.post('/', auth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;

    // Check if already liked
    const { rows: existing } = await db.query(
      'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    let liked;
    if (existing.length > 0) {
      // Unlike
      await db.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      liked = false;
    } else {
      // Like
      await db.query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
      liked = true;

      // Create notification asynchronously
      createLikeNotification(postId, userId).catch(console.error);
    }

    const { rows } = await db.query(
      'SELECT COUNT(*)::int AS like_count FROM likes WHERE post_id = $1',
      [postId]
    );

    res.json({ liked, like_count: rows[0].like_count });
  } catch (err) {
    console.error('POST like error:', err);
    res.status(500).json({ error: 'Like verwerken mislukt.' });
  }
});

module.exports = router;
