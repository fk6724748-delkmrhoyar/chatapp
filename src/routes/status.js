// CK Chat (Node) - status.php + status_view.php port
const express = require('express');
const router = express.Router();
const { q, q1, run } = require('../db');
const { requireLogin } = require('../auth');
const { upload, uploadedUrl, displayName } = require('../helpers');

const anyUpload = upload.any();

const VIDEO_EXTS = ['mp4', 'mov', 'webm', 'm4v', '3gp'];

router.get('/status', requireLogin(), async (req, res, next) => {
  try {
    const me = req.me;
    await run('DELETE FROM status_posts WHERE expires_at<NOW()');
    const mine = await q('SELECT * FROM status_posts WHERE user_id=? ORDER BY id DESC', [me.id]);
    const myLatest = mine[0] || null;
    const others = await q(`
      SELECT s.*, u.name, u.avatar, u.email
      FROM status_posts s
      JOIN users u ON u.id = s.user_id
      WHERE s.user_id <> ?
        AND s.user_id IN (
          SELECT DISTINCT IF(sender_id=?, receiver_id, sender_id)
          FROM messages
          WHERE (sender_id=? OR receiver_id=?)
            AND receiver_id IS NOT NULL
        )
      ORDER BY s.created_at DESC
    `, [me.id, me.id, me.id, me.id]);
    const ads = await q('SELECT * FROM ads WHERE expires_at>NOW() ORDER BY id DESC');
    res.render('status', { tab: 'status', myLatest, others, ads });
  } catch (err) { next(err); }
});

router.post('/status', requireLogin(), anyUpload, async (req, res, next) => {
  try {
    const me = req.me;
    const body = (req.body.body || '').trim();
    let img = null, vid = null;
    const files = req.files || [];
    const f = files.find((x) => x.fieldname === 'image');
    if (f) {
      const ext = (f.originalname.split('.').pop() || '').toLowerCase();
      if (VIDEO_EXTS.includes(ext)) vid = uploadedUrl({ files: [f] }, 'image');
      else img = uploadedUrl({ files: [f] }, 'image');
    }
    if (body || img || vid) {
      await run(
        'INSERT INTO status_posts (user_id,body,image,video,expires_at) VALUES (?,?,?,?,DATE_ADD(NOW(),INTERVAL 24 HOUR))',
        [me.id, body, img, vid]
      );
    }
    res.redirect('/status');
  } catch (err) { next(err); }
});

router.get('/status/:id', requireLogin(), async (req, res, next) => {
  try {
    const me = req.me;
    const id = parseInt(req.params.id, 10) || 0;
    const p = await q1(
      'SELECT s.*,u.name,u.username,u.email,u.avatar FROM status_posts s JOIN users u ON u.id=s.user_id WHERE s.id=?',
      [id]
    );
    if (!p) return res.send('Not found');
    await run('INSERT IGNORE INTO status_views (status_id,user_id) VALUES (?,?)', [id, me.id]);
    const isVideo = !!p.video;
    const durationMs = isVideo ? 0 : 5000;
    res.render('status_view', { p, isVideo, durationMs, displayName });
  } catch (err) { next(err); }
});

module.exports = router;
