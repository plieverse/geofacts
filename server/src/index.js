require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigrations() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
    const seed = fs.readFileSync(path.join(__dirname, 'db/seed.sql'), 'utf8');
    await db.query(schema);
    await db.query(seed);
    console.log('Database migraties uitgevoerd.');
  } catch (err) {
    console.error('Fout bij database-migraties:', err.message);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/posts/:id/comments', require('./routes/comments'));
app.use('/api/posts/:id/like', require('./routes/likes'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/link-preview', require('./routes/linkPreview'));
app.use('/api/push', require('./routes/push'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Niet gevonden.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Er is een interne fout opgetreden.' });
});

runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`GeoFacts server draait op poort ${PORT}`);
  });
});
