const express = require('express');
const router = express.Router();
const db = require('../db');
const adminMiddleware = require('../middleware/admin');

// All routes require admin
router.use(adminMiddleware);

// GET /api/admin/posts
router.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const { rows } = await db.query(
      `SELECT
        p.*,
        u.first_name,
        COUNT(DISTINCT l.id)::int AS like_count,
        COUNT(DISTINCT c.id)::int AS comment_count,
        COALESCE(
          JSON_AGG(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS topics
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON l.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       LEFT JOIN post_topics pt ON pt.post_id = p.id
       LEFT JOIN topics t ON t.id = pt.topic_id
       GROUP BY p.id, u.first_name
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const { rows: countRows } = await db.query('SELECT COUNT(*)::int AS total FROM posts');

    res.json({
      posts: rows,
      total: countRows[0].total,
      page,
      limit,
      totalPages: Math.ceil(countRows[0].total / limit),
    });
  } catch (err) {
    console.error('Admin GET posts error:', err);
    res.status(500).json({ error: 'Berichten ophalen mislukt.' });
  }
});

// PUT /api/admin/posts/:id
router.put('/posts/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { content, linkUrl, linkTitle, linkDescription, linkImage, topicIds } = req.body;

    const { rows: existing } = await db.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (!existing.length) return res.status(404).json({ error: 'Bericht niet gevonden.' });

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `UPDATE posts SET content = $1, link_url = $2, link_title = $3, link_description = $4, link_image = $5, updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [
          content || existing[0].content,
          linkUrl !== undefined ? linkUrl : existing[0].link_url,
          linkTitle !== undefined ? linkTitle : existing[0].link_title,
          linkDescription !== undefined ? linkDescription : existing[0].link_description,
          linkImage !== undefined ? linkImage : existing[0].link_image,
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
    console.error('Admin PUT post error:', err);
    res.status(500).json({ error: 'Bericht bewerken mislukt.' });
  }
});

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM posts WHERE id = $1 RETURNING id', [parseInt(req.params.id)]);
    if (!rows.length) return res.status(404).json({ error: 'Bericht niet gevonden.' });
    res.json({ message: 'Bericht verwijderd.' });
  } catch (err) {
    console.error('Admin DELETE post error:', err);
    res.status(500).json({ error: 'Bericht verwijderen mislukt.' });
  }
});

// PUT /api/admin/topics/reorder
router.put('/topics/reorder', async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds is verplicht.' });
    }
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query('UPDATE topics SET sort_order = $1 WHERE id = $2', [i, orderedIds[i]]);
      }
      await client.query('COMMIT');
      res.json({ message: 'Volgorde opgeslagen.' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Admin PUT topics/reorder error:', err);
    res.status(500).json({ error: 'Volgorde opslaan mislukt.' });
  }
});

// POST /api/admin/users (nieuwe gebruiker toevoegen)
router.post('/users', async (req, res) => {
  try {
    const { firstName } = req.body;
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ error: 'Voornaam is verplicht.' });
    }
    const trimmedName = firstName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({ error: 'Voornaam moet tussen 2 en 50 tekens zijn.' });
    }
    const { rows } = await db.query(
      `INSERT INTO users (first_name, is_approved) VALUES ($1, TRUE) RETURNING *`,
      [trimmedName]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Deze naam bestaat al.' });
    }
    console.error('Admin POST user error:', err);
    res.status(500).json({ error: 'Gebruiker toevoegen mislukt.' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.*, COUNT(DISTINCT p.id)::int AS post_count, COUNT(DISTINCT c.id)::int AS comment_count
       FROM users u
       LEFT JOIN posts p ON p.user_id = u.id
       LEFT JOIN comments c ON c.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin GET users error:', err);
    res.status(500).json({ error: 'Gebruikers ophalen mislukt.' });
  }
});

// DELETE /api/admin/users/:id (alleen als geen berichten of reacties)
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { rows } = await db.query(
      `SELECT
        COUNT(DISTINCT p.id)::int AS post_count,
        COUNT(DISTINCT c.id)::int AS comment_count
       FROM users u
       LEFT JOIN posts p ON p.user_id = u.id
       LEFT JOIN comments c ON c.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Gebruiker niet gevonden.' });
    if (rows[0].post_count > 0 || rows[0].comment_count > 0) {
      return res.status(400).json({ error: 'Gebruiker heeft nog berichten of reacties en kan niet worden verwijderd.' });
    }
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ message: 'Gebruiker verwijderd.' });
  } catch (err) {
    console.error('Admin DELETE user error:', err);
    res.status(500).json({ error: 'Gebruiker verwijderen mislukt.' });
  }
});

module.exports = router;
