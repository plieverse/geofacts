const db = require('../db');
const webpush = require('web-push');

function setupWebPush() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@geofacts.app',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
}

setupWebPush();

async function sendPushToUser(userId, payload) {
  try {
    const { rows: subscriptions } = await db.query(
      'SELECT * FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    const pushPayload = JSON.stringify(payload);

    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };
      try {
        await webpush.sendNotification(pushSubscription, pushPayload);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired or invalid, remove it
          await db.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
        } else {
          console.error('Push send error:', err.message);
        }
      }
    }
  } catch (err) {
    console.error('sendPushToUser error:', err);
  }
}

async function createPostNotifications(postId, authorId) {
  try {
    // Get post info for push notification
    const { rows: postRows } = await db.query(
      `SELECT p.id, p.content, u.first_name FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [postId]
    );
    if (!postRows.length) return;
    const post = postRows[0];

    // Get all users except the author
    const { rows: users } = await db.query(
      'SELECT id FROM users WHERE id != $1',
      [authorId]
    );

    for (const user of users) {
      // Create in-app notification
      await db.query(
        'INSERT INTO notifications (user_id, type, post_id, triggered_by) VALUES ($1, $2, $3, $4)',
        [user.id, 'new_post', postId, authorId]
      );

      // Send push notification
      await sendPushToUser(user.id, {
        title: 'GeoFacts — Nieuw bericht',
        body: `${post.first_name}: ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}`,
        url: `/post/${postId}`,
        type: 'new_post',
      });
    }
  } catch (err) {
    console.error('createPostNotifications error:', err);
  }
}

async function createCommentNotification(postId, commenterId) {
  try {
    // Get post author
    const { rows: postRows } = await db.query(
      `SELECT p.user_id, u.first_name as commenter_name FROM posts p
       JOIN users u ON u.id = $2
       WHERE p.id = $1`,
      [postId, commenterId]
    );
    if (!postRows.length) return;

    const postAuthorId = postRows[0].user_id;
    const commenterName = postRows[0].commenter_name;

    // Don't notify yourself
    if (postAuthorId === commenterId) return;

    // Create in-app notification
    await db.query(
      'INSERT INTO notifications (user_id, type, post_id, triggered_by) VALUES ($1, $2, $3, $4)',
      [postAuthorId, 'comment', postId, commenterId]
    );

    // Send push notification
    await sendPushToUser(postAuthorId, {
      title: 'GeoFacts — Nieuwe reactie',
      body: `${commenterName} reageerde op jouw bericht`,
      url: `/post/${postId}`,
      type: 'comment',
    });
  } catch (err) {
    console.error('createCommentNotification error:', err);
  }
}

async function createLikeNotification(postId, likerId) {
  try {
    // Get post author
    const { rows: postRows } = await db.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );
    if (!postRows.length) return;

    const postAuthorId = postRows[0].user_id;

    // Don't notify yourself
    if (postAuthorId === likerId) return;

    // Create in-app notification only (no push for likes)
    await db.query(
      'INSERT INTO notifications (user_id, type, post_id, triggered_by) VALUES ($1, $2, $3, $4)',
      [postAuthorId, 'like', postId, likerId]
    );
  } catch (err) {
    console.error('createLikeNotification error:', err);
  }
}

async function createCommentLikeNotification(commentId, likerId) {
  try {
    const { rows } = await db.query(
      'SELECT user_id, post_id FROM comments WHERE id = $1',
      [commentId]
    );
    if (!rows.length) return;
    const { user_id: commentAuthorId, post_id: postId } = rows[0];
    if (commentAuthorId === likerId) return;

    await db.query(
      'INSERT INTO notifications (user_id, type, post_id, triggered_by) VALUES ($1, $2, $3, $4)',
      [commentAuthorId, 'comment_like', postId, likerId]
    );
    // Geen push-notificatie voor likes (zelfde gedrag als likes op berichten)
  } catch (err) {
    console.error('createCommentLikeNotification error:', err);
  }
}

module.exports = {
  createPostNotifications,
  createCommentNotification,
  createLikeNotification,
  createCommentLikeNotification,
};
