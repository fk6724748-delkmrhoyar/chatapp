// CK Chat (Node) - chats.php, chat.php (+ajax poll), contacts.php, search_users.php, camera.php, ad_view.php
const express = require('express');
const { q, q1, run } = require('../db');
const { upload, uploadedUrl, displayName, isOnline, attachmentKind } = require('../helpers');
const { requireLogin } = require('../auth');

const router = express.Router();
const anyUpload = upload.any();

// ---- chats.php : list of 1-to-1 chats + groups ----
router.get('/chats', requireLogin(), async (req, res, next) => {
  try {
    const me = req.me;
    const chats = await q(`
      SELECT u.id,u.name,u.email,u.avatar,u.last_seen,u.blue_tick,
        (SELECT body FROM messages m WHERE ((m.sender_id=u.id AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=u.id)) ORDER BY m.id DESC LIMIT 1) as last_msg,
        (SELECT created_at FROM messages m WHERE ((m.sender_id=u.id AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=u.id)) ORDER BY m.id DESC LIMIT 1) as last_t,
        (SELECT COUNT(*) FROM messages m WHERE m.sender_id=u.id AND m.receiver_id=? AND m.seen=0) as unread
      FROM users u
      WHERE u.id<>? AND u.id IN (
        SELECT IF(sender_id=?,receiver_id,sender_id) FROM messages WHERE sender_id=? OR receiver_id=?
      )
      ORDER BY last_t DESC
    `, [me.id, me.id, me.id, me.id, me.id, me.id, me.id, me.id, me.id]);

    const groups = await q(`
      SELECT g.*,
        (SELECT body FROM messages m WHERE m.group_id=g.id ORDER BY m.id DESC LIMIT 1) last_msg,
        (SELECT created_at FROM messages m WHERE m.group_id=g.id ORDER BY m.id DESC LIMIT 1) last_t,
        (SELECT COUNT(*) FROM messages m WHERE m.group_id=g.id AND m.sender_id<>? AND m.id > IFNULL((SELECT last_msg_id FROM group_reads WHERE group_id=g.id AND user_id=?),0)) AS unread
      FROM groups_tbl g JOIN group_members gm ON gm.group_id=g.id WHERE gm.user_id=?
      ORDER BY COALESCE(last_t,g.created_at) DESC
    `, [me.id, me.id, me.id]);

    const qStr = (req.query.q || '').toString().trim();
    res.render('chats', { title: res.locals.app_name, chats, groups, q: qStr, tab: 'chats' });
  } catch (err) { next(err); }
});

// ---- chat.php ajax poll endpoint : GET /chat/:id/poll ----
router.get('/chat/:id/poll', requireLogin(), async (req, res, next) => {
  try {
    const me = req.me;
    const uid = parseInt(req.params.id, 10) || 0;
    const peer = await q1('SELECT * FROM users WHERE id=?', [uid]);
    if (!peer) return res.json({ ok: false });

    const since = parseInt(req.query.since, 10) || 0;
    await run('UPDATE messages SET seen=1, delivered=1 WHERE sender_id=? AND receiver_id=?', [uid, me.id]);
    const rows = await q(
      'SELECT * FROM messages WHERE ((sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)) AND id>? ORDER BY id ASC',
      [me.id, uid, uid, me.id, since]
    );
    const out = rows.map((m) => {
      const att = m.attachment || '';
      const kind = att ? attachmentKind(att) : '';
      const d = m.created_at ? new Date(String(m.created_at).replace(' ', 'T')) : null;
      return {
        id: m.id,
        out: m.sender_id === me.id,
        body: m.body,
        attachment: att,
        kind,
        seen: m.seen ? 1 : 0,
        delivered: m.delivered ? 1 : 0,
        time: res.locals.timeAmPm(m.created_at),
        day: res.locals.dayKey(m.created_at),
        dayLabel: res.locals.dayLabel(m.created_at),
      };
    });
    const ticks = await q('SELECT id, seen, delivered FROM messages WHERE sender_id=? AND receiver_id=? ORDER BY id DESC LIMIT 30', [me.id, uid]);
    res.json({ ok: true, messages: out, ticks });
  } catch (err) { next(err); }
});

// ---- chat.php : GET (view) + call redirect + POST (send message) ----
router.get('/chat/:id', requireLogin(), async (req, res, next) => {
  try {
    const me = req.me;
    const uid = parseInt(req.params.id, 10) || 0;
    const peer = await q1('SELECT * FROM users WHERE id=?', [uid]);
    if (!peer) return res.redirect('/chats');

    const isBroadcastBot = peer.email === 'broadcast@ck.system';
    if (['voice', 'video'].includes(req.query.call) && !isBroadcastBot) {
      await run("INSERT INTO calls (caller_id,callee_id,type,status) VALUES (?,?,?,'no_answer')", [me.id, uid, req.query.call]);
      const cid = (await q1('SELECT LAST_INSERT_ID() AS id')).id;
      return res.redirect(`/call/${cid}?mode=outgoing`);
    }

    // mark seen
    await run('UPDATE messages SET seen=1, delivered=1 WHERE sender_id=? AND receiver_id=?', [uid, me.id]);

    const msgs = await q(
      'SELECT * FROM messages WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?) ORDER BY id ASC',
      [me.id, uid, uid, me.id]
    );

    const isBlockedByMe = !!(await q1('SELECT 1 x FROM blocks WHERE user_id=? AND blocked_id=?', [me.id, uid]));
    const isBlockedByThem = !!(await q1('SELECT 1 x FROM blocks WHERE user_id=? AND blocked_id=?', [uid, me.id]));

    res.render('chat', {
      title: displayName(peer),
      peer, uid, msgs,
      isBroadcastBot, isBlockedByMe, isBlockedByThem,
      online: isOnline(peer.last_seen),
      tab: '',
    });
  } catch (err) { next(err); }
});

router.post('/chat/:id', requireLogin(), anyUpload, async (req, res, next) => {
  try {
    const me = req.me;
    const uid = parseInt(req.params.id, 10) || 0;
    const peer = await q1('SELECT * FROM users WHERE id=?', [uid]);
    if (!peer) return res.redirect('/chats');
    const isBroadcastBot = peer.email === 'broadcast@ck.system';
    if (isBroadcastBot) return res.redirect(`/chat/${uid}`);

    const body = String((req.body && req.body.body) || '').trim();
    let att = uploadedUrl(req, 'attachment');
    if (!att) att = uploadedUrl(req, 'attachment_cam');

    const blocked = await q1(
      'SELECT 1 x FROM blocks WHERE (user_id=? AND blocked_id=?) OR (user_id=? AND blocked_id=?)',
      [me.id, uid, uid, me.id]
    );
    if ((body !== '' || att) && !blocked) {
      const peerOnline = isOnline(peer.last_seen);
      const r = await run(
        'INSERT INTO messages (sender_id,receiver_id,body,attachment,delivered) VALUES (?,?,?,?,?)',
        [me.id, uid, body, att || null, peerOnline ? 1 : 0]
      );
      const msg = await q1('SELECT * FROM messages WHERE id=?', [r.insertId]);
      // realtime: notify the receiver instantly (in addition to the poll endpoint)
      const io = req.app.get('io');
      if (io && msg) {
        io.to('user:' + uid).emit('message:new', {
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          body: msg.body,
          attachment: msg.attachment || '',
          kind: msg.attachment ? attachmentKind(msg.attachment) : '',
          time: res.locals.timeAmPm(msg.created_at),
          day: res.locals.dayKey(msg.created_at),
        });
      }
    }
    res.redirect(`/chat/${uid}`);
  } catch (err) { next(err); }
});

// ---- contacts.php ----
router.get('/contacts', requireLogin(), async (req, res, next) => {
  try {
    const me = req.me;
    const qStr = (req.query.q || '').toString().trim();
    let users;
    if (qStr.length > 0) {
      const like = `%${qStr}%`;
      users = await q(
        'SELECT id,name,username,email,avatar,blue_tick FROM users WHERE id<>? AND banned=0 AND (name LIKE ? OR username LIKE ? OR email LIKE ? OR phone LIKE ?) LIMIT 50',
        [me.id, like, like, like, like]
      );
    } else {
      users = await q('SELECT id,name,username,email,avatar,blue_tick FROM users WHERE id<>? AND banned=0 ORDER BY id ASC LIMIT 5', [me.id]);
    }
    res.render('contacts', { title: 'Select contact', users, q: qStr, tab: '' });
  } catch (err) { next(err); }
});

// ---- search_users.php ----
router.get('/search', requireLogin(), async (req, res, next) => {
  try {
    const me = req.me;
    const qStr = (req.query.q || '').toString().trim();
    let users = [];
    if (qStr) {
      const like = `%${qStr}%`;
      users = await q(
        'SELECT id,name,username,email,avatar,blue_tick FROM users WHERE id<>? AND banned=0 AND (name LIKE ? OR username LIKE ? OR email LIKE ? OR phone LIKE ?) LIMIT 30',
        [me.id, like, like, like, like]
      );
    }
    res.render('search', { title: 'Search', users, q: qStr, tab: '' });
  } catch (err) { next(err); }
});

// ---- camera.php ----
router.get('/camera', requireLogin(), (req, res) => {
  res.render('camera', { title: 'Camera', tab: '' });
});

router.post('/camera', requireLogin(), anyUpload, async (req, res, next) => {
  try {
    const me = req.me;
    const body = String((req.body && req.body.body) || '').trim();
    let img = null, vid = null;
    const files = req.files || [];
    const f = files.find((x) => x.fieldname === 'image');
    if (f) {
      const ext = (f.originalname.split('.').pop() || '').toLowerCase();
      const url = '/uploads/' + f.filename;
      if (['mp4', 'mov', 'webm', 'm4v', '3gp'].includes(ext)) vid = url; else img = url;
    }
    if (img || vid || body) {
      await run(
        'INSERT INTO status_posts (user_id,body,image,video,expires_at) VALUES (?,?,?,?,DATE_ADD(NOW(),INTERVAL 24 HOUR))',
        [me.id, body, img, vid]
      );
    }
    res.redirect('/status');
  } catch (err) { next(err); }
});

// ---- ad_view.php ----
router.get('/ad/:id', requireLogin(), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10) || 0;
    const ad = await q1('SELECT * FROM ads WHERE id=? AND expires_at>NOW()', [id]);
    if (!ad) return res.redirect('/status');
    const isVideo = !!ad.video;
    const durationMs = isVideo ? 0 : 10000;
    const title = ad.title || 'Sponsored';
    res.render('ad_view', { title, ad, isVideo, durationMs, tab: '' });
  } catch (err) { next(err); }
});

module.exports = router;
