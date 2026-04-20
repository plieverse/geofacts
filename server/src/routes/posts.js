const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { createPostNotifications } = require('../services/notificationService');

// GET /api/posts
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy === 'likes' ? 'likes' : 'date';
    const userId = req.query.userId ? parseInt(req.query.userId) : null;
    const topicId = req.query.topicId ? parseInt(req.query.topicId) : null;
    const search = req.query.search ? req.query.search.trim() : null;

    // Determine current user from token if provided
    let currentUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        currentUserId = decoded.id;
      } catch (_) {}
    }

    let whereConditions = [];
    let params = [];
    let paramIdx = 1;

    if (userId) {
      whereConditions.push(`p.user_id = $${paramIdx++}`);
      params.push(userId);
    }

    if (topicId) {
      whereConditions.push(`EXISTS (SELECT 1 FROM post_topics pt WHERE pt.post_id = p.id AND pt.topic_id = $${paramIdx++})`);
      params.push(topicId);
    }

    if (search) {
      whereConditions.push(`(p.content ILIKE $${paramIdx} OR p.link_url ILIKE $${paramIdx} OR p.link_title ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const orderClause = sortBy === 'likes'
      ? 'ORDER BY p.is_pinned DESC, like_count DESC, p.created_at DESC'
      : 'ORDER BY p.is_pinned DESC, p.created_at DESC';

    const query = `
      SELECT
        p.*,
        u.first_name,
        u.is_admin,
        COUNT(DISTINCT l.id)::int AS like_count,
        COUNT(DISTINCT c.id)::int AS comment_count,
        ${currentUserId ? `BOOL_OR(l2.user_id = ${currentUserId}) AS user_liked,` : 'FALSE AS user_liked,'}
        COALESCE(
          JSON_AGG(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS topics
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON l.post_id = p.id
      ${currentUserId ? `LEFT JOIN likes l2 ON l2.post_id = p.id AND l2.user_id = ${currentUserId}` : ''}
      LEFT JOIN comments c ON c.post_id = p.id
      LEFT JOIN post_topics pt ON pt.post_id = p.id
      LEFT JOIN topics t ON t.id = pt.topic_id
      ${whereClause}
      GROUP BY p.id, u.first_name, u.is_admin
      ${orderClause}
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;
    params.push(limit, offset);

    const countQuery = `
      SELECT COUNT(DISTINCT p.id)::int AS total
      FROM posts p
      ${topicId ? 'LEFT JOIN post_topics pt ON pt.post_id = p.id' : ''}
      ${whereClause}
    `;
    const countParams = params.slice(0, params.length - 2);

    const [{ rows }, { rows: countRows }] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams),
    ]);

    res.json({
      posts: rows,
      total: countRows[0]?.total || 0,
      page,
      limit,
      totalPages: Math.ceil((countRows[0]?.total || 0) / limit),
    });
  } catch (err) {
    console.error('GET /posts error:', err);
    res.status(500).json({ error: 'Berichten ophalen mislukt.' });
  }
});

// GET /api/posts/:id
router.get('/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

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
        p.*,
        u.first_name,
        u.is_admin,
        COUNT(DISTINCT l.id)::int AS like_count,
        ${currentUserId ? `BOOL_OR(l2.user_id = ${currentUserId}) AS user_liked,` : 'FALSE AS user_liked,'}
        COALESCE(
          JSON_AGG(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS topics
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON l.post_id = p.id
      ${currentUserId ? `LEFT JOIN likes l2 ON l2.post_id = p.id AND l2.user_id = ${currentUserId}` : ''}
      LEFT JOIN post_topics pt ON pt.post_id = p.id
      LEFT JOIN topics t ON t.id = pt.topic_id
      WHERE p.id = $1
      GROUP BY p.id, u.first_name, u.is_admin`,
      [postId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Bericht niet gevonden.' });
    }

    // Get comments
    const { rows: comments } = await db.query(
      `SELECT c.*, u.first_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = $1 ORDER BY c.created_at ASC`,
      [postId]
    );

    res.json({ ...rows[0], comments });
  } catch (err) {
    console.error('GET /posts/:id error:', err);
    res.status(500).json({ error: 'Bericht ophalen mislukt.' });
  }
});

// POST /api/posts
router.post('/', auth, async (req, res) => {
  try {
    const { content, linkUrl, linkTitle, linkDescription, linkImage, topicIds, summary, summaryIsManual } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Inhoud is verplicht.' });
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const summaryValue = summary && summary.trim() ? summary.trim() : null;
      const summaryStatusValue = summaryValue
        ? (summaryIsManual ? 'manual' : 'generated')
        : null;

      const { rows } = await client.query(
        `INSERT INTO posts (user_id, content, link_url, link_title, link_description, link_image, summary, summary_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          req.user.id,
          content.trim(),
          linkUrl || null,
          linkTitle || null,
          linkDescription || null,
          linkImage || null,
          summaryValue,
          summaryStatusValue,
        ]
      );

      const post = rows[0];

      if (topicIds && Array.isArray(topicIds) && topicIds.length > 0) {
        for (const topicId of topicIds) {
          await client.query(
            'INSERT INTO post_topics (post_id, topic_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [post.id, topicId]
          );
        }
      }

      await client.query('COMMIT');

      // Create notifications asynchronously
      createPostNotifications(post.id, req.user.id).catch(console.error);

      res.status(201).json(post);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('POST /posts error:', err);
    res.status(500).json({ error: 'Bericht aanmaken mislukt.' });
  }
});

// PUT /api/posts/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { content, linkUrl, linkTitle, linkDescription, linkImage, topicIds, summary, summaryIsManual } = req.body;

    // Check ownership (or admin)
    const { rows: existing } = await db.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (!existing.length) return res.status(404).json({ error: 'Bericht niet gevonden.' });
    if (existing[0].user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Geen toegang om dit bericht te bewerken.' });
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // summary: null = verwijderen, undefined = ongewijzigd laten, string = opslaan
      const summaryValue = summary === null ? null
        : summary !== undefined && summary.trim() ? summary.trim()
        : existing[0].summary;
      const summaryStatusValue = summary === null ? null
        : summary !== undefined && summary.trim()
          ? (summaryIsManual ? 'manual' : 'generated')
          : existing[0].summary_status;

      const { rows } = await client.query(
        `UPDATE posts SET content = $1, link_url = $2, link_title = $3, link_description = $4, link_image = $5,
         summary = $6, summary_status = $7, updated_at = NOW()
         WHERE id = $8 RETURNING *`,
        [
          content || existing[0].content,
          linkUrl !== undefined ? linkUrl : existing[0].link_url,
          linkTitle !== undefined ? linkTitle : existing[0].link_title,
          linkDescription !== undefined ? linkDescription : existing[0].link_description,
          linkImage !== undefined ? linkImage : existing[0].link_image,
          summaryValue,
          summaryStatusValue,
          postId,
        ]
      );

      if (topicIds && Array.isArray(topicIds)) {
        await client.query('DELETE FROM post_topics WHERE post_id = $1', [postId]);
        for (const topicId of topicIds) {
          await client.query(
            'INSERT INTO post_topics (post_id, topic_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [postId, topicId]
          );
        }
      }

      await client.query('COMMIT');
      res.json(rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('PUT /posts/:id error:', err);
    res.status(500).json({ error: 'Bericht bewerken mislukt.' });
  }
});

// POST /api/posts/:id/pin (toggle vastpinnen, elke ingelogde gebruiker)
router.post('/:id/pin', auth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { rows } = await db.query('SELECT id, is_pinned FROM posts WHERE id = $1', [postId]);
    if (!rows.length) return res.status(404).json({ error: 'Bericht niet gevonden.' });

    const currentlyPinned = rows[0].is_pinned;
    if (currentlyPinned) {
      await db.query('UPDATE posts SET is_pinned = FALSE WHERE id = $1', [postId]);
      res.json({ pinned: false });
    } else {
      await db.query('UPDATE posts SET is_pinned = FALSE');
      await db.query('UPDATE posts SET is_pinned = TRUE WHERE id = $1', [postId]);
      res.json({ pinned: true });
    }
  } catch (err) {
    console.error('POST pin error:', err);
    res.status(500).json({ error: 'Pinnen mislukt.' });
  }
});

// DELETE /api/posts/:id (eigen berichten of admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { rows: existing } = await db.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (!existing.length) return res.status(404).json({ error: 'Bericht niet gevonden.' });
    if (existing[0].user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Geen toegang om dit bericht te verwijderen.' });
    }
    await db.query('DELETE FROM posts WHERE id = $1', [postId]);
    res.json({ message: 'Bericht verwijderd.' });
  } catch (err) {
    console.error('DELETE /posts/:id error:', err);
    res.status(500).json({ error: 'Bericht verwijderen mislukt.' });
  }
});

module.exports = router;
