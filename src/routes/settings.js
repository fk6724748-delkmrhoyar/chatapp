// CK Chat (Node) - settings.php, menu.php, user_profile.php, support.php, verify_request.php
const express = require('express');
const router = express.Router();
const { q, q1, run, setting } = require('../db');
const { requireLogin } = require('../auth');
const { upload, uploadedUrl, usernameSlug } = require('../helpers');

const anyUpload = upload.any();

router.use(requireLogin());

// ---- settings.php -> /settings ----
router.get('/settings', (req, res) => {
  res.render('settings', { title: 'Settings', tab: '' });
});

router.post('/settings', anyUpload, async (req, res, next) => {
  try {
    const me = req.me;
    const b = req.body || {};
    if (b.delete_account !== undefined) {
      await run('DELETE FROM messages WHERE sender_id=? OR receiver_id=?', [me.id, me.id]);
      await run('DELETE FROM users WHERE id=?', [me.id]);
      req.session.destroy(() => res.redirect('/'));
      return;
    }
    if (b.name !== undefined) {
      const av = uploadedUrl(req, 'avatar') || me.avatar;
      const about = String(b.about || '').trim();
      const username = usernameSlug(b.username || '');
      if (username && username !== me.username) {
        const dup = await q1('SELECT id FROM users WHERE username=? AND id<>?', [username, me.id]);
        if (!dup) await run('UPDATE users SET username=? WHERE id=?', [username, me.id]);
      }
      let canChangeName = true;
      if (me.username_changed_at && new Date(me.username_changed_at).getTime() > Date.now() - 15 * 24 * 60 * 60 * 1000) {
        canChangeName = false;
      }
      if (canChangeName && String(b.name || '').trim() !== me.name) {
        await run('UPDATE users SET name=?,username_changed_at=NOW() WHERE id=?', [String(b.name || '').trim(), me.id]);
      }
      const dark = b.dark_mode !== undefined ? 1 : 0;
      const priv = b.is_private !== undefined ? 1 : 0;
      await run('UPDATE users SET about=?,avatar=?,dark_mode=?,is_private=? WHERE id=?', [about, av, dark, priv, me.id]);
    }
    if (b.wallpaper !== undefined) {
      const wp = uploadedUrl(req, 'wallpaper');
      if (wp) await run('UPDATE users SET wallpaper=? WHERE id=?', [wp, me.id]);
    }
    if (b.title !== undefined) {
      await run('INSERT INTO support_tickets (user_id,email,title,description) VALUES (?,?,?,?)', [me.id, me.email, b.title, b.description]);
    }
    res.redirect('/settings?ok=1');
  } catch (err) { next(err); }
});

// ---- menu.php -> /menu ----
router.get('/menu', (req, res) => {
  res.render('menu', { title: 'Menu', tab: '' });
});

router.post('/menu', async (req, res, next) => {
  try {
    if (req.body.toggle_dark !== undefined) {
      const me = req.me;
      const nv = !me.dark_mode ? 1 : 0;
      await run('UPDATE users SET dark_mode=? WHERE id=?', [nv, me.id]);
    }
    res.redirect('/menu');
  } catch (err) { next(err); }
});

// ---- user_profile.php -> /user/:id ----
router.get('/user/:id', async (req, res, next) => {
  try {
    const me = req.me;
    const uid = parseInt(req.params.id, 10) || 0;
    if (uid === me.id) return res.redirect('/settings');
    const u = await q1('SELECT * FROM users WHERE id=?', [uid]);
    if (!u) return res.status(200).send('No user');
    const isBroadcastBot = u.email === 'broadcast@ck.system';
    const blockedRow = await q1('SELECT 1 x FROM blocks WHERE user_id=? AND blocked_id=?', [me.id, uid]);
    const isBlocked = !!blockedRow;
    const reportedRow = await q1("SELECT 1 x FROM reports WHERE reporter_id=? AND target_id=? AND target_type='user'", [me.id, uid]);
    const alreadyReported = !!reportedRow;
    res.render('user_profile', { title: 'Profile', tab: '', u, uid, isBroadcastBot, isBlocked, alreadyReported, query: req.query });
  } catch (err) { next(err); }
});

router.post('/user/:id', async (req, res, next) => {
  try {
    const me = req.me;
    const uid = parseInt(req.params.id, 10) || 0;
    const action = req.body.action || '';
    if (action === 'block') await run('INSERT IGNORE INTO blocks (user_id,blocked_id) VALUES (?,?)', [me.id, uid]);
    if (action === 'unblock') await run('DELETE FROM blocks WHERE user_id=? AND blocked_id=?', [me.id, uid]);
    if (action === 'clear') {
      await run('DELETE FROM messages WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)', [me.id, uid, uid, me.id]);
    }
    if (action === 'report') {
      const reason = String(req.body.reason || '').trim();
      if (reason !== '') await run("INSERT INTO reports (reporter_id,target_id,target_type,reason) VALUES (?,?, 'user',?)", [me.id, uid, reason]);
    }
    res.redirect(`/user/${uid}?done=1`);
  } catch (err) { next(err); }
});

// ---- support.php -> /support ----
router.get('/support', async (req, res, next) => {
  try {
    const me = req.me;
    const tickets = await q('SELECT * FROM support_tickets WHERE user_id=? ORDER BY id DESC', [me.id]);
    res.render('support', { title: 'Support Center', tab: '', tickets, query: req.query });
  } catch (err) { next(err); }
});

router.post('/support', async (req, res, next) => {
  try {
    const me = req.me;
    await run('INSERT INTO support_tickets (user_id,email,title,description) VALUES (?,?,?,?)', [
      me.id, me.email, String(req.body.title || '').trim(), String(req.body.description || '').trim(),
    ]);
    res.redirect('/support?ok=1');
  } catch (err) { next(err); }
});

// ---- verify_request.php -> /verify-request ----
router.get('/verify-request', (req, res) => {
  res.render('verify_request', { title: 'Verification request', tab: '', query: req.query });
});

router.post('/verify-request', anyUpload, async (req, res, next) => {
  try {
    const me = req.me;
    const b = req.body || {};
    const shot = uploadedUrl(req, 'screenshot');
    await run(
      'INSERT INTO verify_requests (user_id,target_type,target_name,email,method,trx_id,screenshot) VALUES (?,?,?,?,?,?,?)',
      [me.id, b.target_type, b.target_name, b.email, b.method, b.trx_id, shot]
    );
    res.redirect('/verify-request?ok=1');
  } catch (err) { next(err); }
});

module.exports = router;
