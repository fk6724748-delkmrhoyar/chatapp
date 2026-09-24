// Channel routes: mirrors channels.php, channel.php, channel_new.php, channel_profile.php
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { q, q1, run } = require('../db');
const { requireLogin } = require('../auth');
const { upload, uploadedUrl, usernameSlug } = require('../helpers');

router.use(requireLogin());

// channels.php -> /channels
router.get('/channels', async (req, res) => {
  const me = req.me;
  const qStr = String(req.query.q || '').trim();
  const showAll = req.query.all === '1';

  if (qStr !== '') {
    const results = await q(
      `SELECT c.*, (SELECT COUNT(*) FROM channel_followers cf WHERE cf.channel_id=c.id)+IFNULL(c.bonus_followers,0) AS fcount
       FROM channels c WHERE c.banned=0 AND c.name LIKE ? ORDER BY fcount DESC, c.id DESC LIMIT 50`,
      ['%' + qStr + '%']
    );
    return res.render('channels', { q: qStr, showAll, results, mine: [], discover: [], totalDiscover: 0, tab: 'channels' });
  }

  const mine = await q(
    `SELECT c.*,
        (SELECT COUNT(*) FROM channel_followers cf WHERE cf.channel_id=c.id)+IFNULL(c.bonus_followers,0) AS fcount,
        (SELECT body FROM messages m WHERE m.channel_id=c.id ORDER BY m.id DESC LIMIT 1) AS last_msg,
        (SELECT attachment FROM messages m WHERE m.channel_id=c.id ORDER BY m.id DESC LIMIT 1) AS last_att,
        (SELECT created_at FROM messages m WHERE m.channel_id=c.id ORDER BY m.id DESC LIMIT 1) AS last_t,
        (SELECT COUNT(*) FROM messages m WHERE m.channel_id=c.id AND m.sender_id<>? AND m.id > IFNULL((SELECT last_msg_id FROM channel_reads WHERE channel_id=c.id AND user_id=?),0)) AS unread
      FROM channels c
      WHERE c.banned=0 AND (c.owner_id=? OR c.id IN (SELECT channel_id FROM channel_followers WHERE user_id=?))
      ORDER BY (last_t IS NULL), last_t DESC, c.id DESC`,
    [me.id, me.id, me.id, me.id]
  );

  const limit = showAll ? 200 : 4;
  const discover = await q(
    `SELECT c.*, (SELECT COUNT(*) FROM channel_followers cf WHERE cf.channel_id=c.id)+IFNULL(c.bonus_followers,0) AS fcount
     FROM channels c WHERE c.banned=0 ORDER BY fcount DESC, c.id DESC LIMIT ${limit}`
  );
  const totalDiscoverRow = await q1('SELECT COUNT(*) AS c FROM channels WHERE banned=0');

  res.render('channels', {
    q: qStr, showAll, results: [], mine, discover, totalDiscover: totalDiscoverRow.c, tab: 'channels',
  });
});

// channel_new.php -> /channel/new
router.get('/channel/new', (req, res) => {
  res.render('channel_new', { err: '', name: '', description: '' });
});

router.post('/channel/new', upload.any(), async (req, res) => {
  const me = req.me;
  const raw = String(req.body.name || '').trim();
  const name = usernameSlug(raw);
  let err = '';
  if (name === '' || name.length < 3) {
    err = 'Channel name must be at least 3 characters (letters, numbers, _ or . only — no spaces).';
  } else {
    const chk = await q1('SELECT id FROM channels WHERE LOWER(name)=?', [name]);
    if (chk) {
      err = 'Already used — this channel name is taken.';
    } else {
      const av = uploadedUrl(req, 'avatar');
      const existingRow = await q1('SELECT COUNT(*) AS c FROM channels');
      const bonus = existingRow.c === 0 ? 1000 : 0;
      const result = await run(
        'INSERT INTO channels (name,description,avatar,owner_id,bonus_followers) VALUES (?,?,?,?,?)',
        [name, req.body.description || '', av || null, me.id, bonus]
      );
      const cid = result.insertId;
      await run('INSERT INTO channel_followers (channel_id,user_id) VALUES (?,?)', [cid, me.id]);
      return res.redirect('/channel/' + cid);
    }
  }
  res.render('channel_new', { err, name: req.body.name || '', description: req.body.description || '' });
});

// channel.php -> /channel/:id (with ?invite= support)
router.get('/channel/:id', async (req, res) => {
  const me = req.me;

  if (req.query.invite !== undefined) {
    const tok = String(req.query.invite).trim();
    const c = await q1('SELECT * FROM channels WHERE invite_token=? AND banned=0', [tok]);
    if (c) {
      await run('INSERT IGNORE INTO channel_followers (channel_id,user_id) VALUES (?,?)', [c.id, me.id]);
      return res.redirect('/channel/' + c.id);
    }
    return res.status(200).send('Invalid invite link.');
  }

  const id = parseInt(req.params.id, 10) || 0;
  const c = await q1('SELECT * FROM channels WHERE id=?', [id]);
  if (!c) return res.status(200).send('No channel');

  const followersRow = await q1('SELECT COUNT(*) AS c FROM channel_followers WHERE channel_id=?', [id]);
  const followers = followersRow.c + (c.bonus_followers || 0);
  const isFollowRow = await q1('SELECT 1 AS x FROM channel_followers WHERE channel_id=? AND user_id=?', [id, me.id]);
  const isFollow = !!isFollowRow;
  const msgs = await q('SELECT * FROM messages WHERE channel_id=? ORDER BY id ASC', [id]);

  let lastId = 0;
  for (const mm of msgs) if (mm.id > lastId) lastId = mm.id;
  try {
    await run(
      'INSERT INTO channel_reads (channel_id,user_id,last_msg_id) VALUES (?,?,?) ON DUPLICATE KEY UPDATE last_msg_id=GREATEST(last_msg_id,VALUES(last_msg_id))',
      [id, me.id, lastId]
    );
  } catch (e) { /* ignore */ }

  res.render('channel', { c, id, followers, isFollow, msgs });
});

router.post('/channel/:id', upload.any(), async (req, res) => {
  const me = req.me;
  const id = parseInt(req.params.id, 10) || 0;
  const c = await q1('SELECT * FROM channels WHERE id=?', [id]);
  if (!c) return res.status(200).send('No channel');

  if (req.body.follow !== undefined) {
    await run('INSERT IGNORE INTO channel_followers (channel_id,user_id) VALUES (?,?)', [id, me.id]);
    return res.redirect('/channel/' + id);
  }
  if (req.body.unfollow !== undefined) {
    await run('DELETE FROM channel_followers WHERE channel_id=? AND user_id=?', [id, me.id]);
    return res.redirect('/channel/' + id);
  }
  if (req.body.body !== undefined && c.owner_id == me.id) {
    const body = String(req.body.body).trim();
    const att = uploadedUrl(req, 'attachment');
    if (body !== '' || att) {
      await run(
        'INSERT INTO messages (sender_id,channel_id,body,attachment) VALUES (?,?,?,?)',
        [me.id, id, body, att || null]
      );
    }
    return res.redirect('/channel/' + id);
  }
  res.redirect('/channel/' + id);
});

// channel_profile.php -> /channel/:id/profile
router.get('/channel/:id/profile', async (req, res) => {
  const me = req.me;
  const id = parseInt(req.params.id, 10) || 0;
  const c = await q1('SELECT * FROM channels WHERE id=?', [id]);
  if (!c) return res.status(200).send('No channel');
  const isOwner = c.owner_id == me.id;

  const followersRow = await q1('SELECT COUNT(*) AS c FROM channel_followers WHERE channel_id=?', [id]);
  const followers = followersRow.c + (c.bonus_followers || 0);
  const ownerInfo = await q1('SELECT name,username FROM users WHERE id=?', [c.owner_id]);
  const alreadyReportedRow = await q1(
    "SELECT 1 AS x FROM reports WHERE reporter_id=? AND target_id=? AND target_type='channel'",
    [me.id, id]
  );
  const alreadyReported = !!alreadyReportedRow;

  let inviteUrl = '';
  if (c.invite_token) {
    const base = req.protocol + '://' + req.get('host');
    inviteUrl = base + '/channel/' + id + '?invite=' + c.invite_token;
  }

  res.render('channel_profile', { c, id, isOwner, followers, ownerInfo, alreadyReported, inviteUrl });
});

router.post('/channel/:id/profile', upload.any(), async (req, res) => {
  const me = req.me;
  const id = parseInt(req.params.id, 10) || 0;
  const c = await q1('SELECT * FROM channels WHERE id=?', [id]);
  if (!c) return res.status(200).send('No channel');
  const isOwner = c.owner_id == me.id;
  const action = req.body.action || '';

  if (action === 'edit' && isOwner) {
    const name = String(req.body.name || c.name).trim();
    const desc = String(req.body.description || c.description).trim();
    const av = uploadedUrl(req, 'avatar') || c.avatar;
    await run('UPDATE channels SET name=?,description=?,avatar=? WHERE id=?', [name, desc, av, id]);
  }
  if (action === 'gen_invite' && isOwner) {
    const tok = crypto.randomBytes(8).toString('hex');
    await run('UPDATE channels SET invite_token=? WHERE id=?', [tok, id]);
  }
  if (action === 'transfer' && isOwner) {
    const newOwnerUsername = usernameSlug(req.body.new_owner || '');
    const u = await q1('SELECT id FROM users WHERE username=? AND banned=0', [newOwnerUsername]);
    if (u) {
      await run('UPDATE channels SET owner_id=? WHERE id=?', [u.id, id]);
      await run('INSERT IGNORE INTO channel_followers (channel_id,user_id) VALUES (?,?)', [id, u.id]);
      return res.redirect('/channel/' + id);
    }
  }
  if (action === 'report') {
    const reason = String(req.body.reason || '').trim();
    if (reason !== '') {
      await run(
        "INSERT INTO reports (reporter_id,target_id,target_type,reason) VALUES (?,?, 'channel',?)",
        [me.id, id, reason]
      );
    }
  }
  if (action === 'unfollow') {
    await run('DELETE FROM channel_followers WHERE channel_id=? AND user_id=?', [id, me.id]);
  }
  res.redirect('/channel/' + id + '/profile?done=1');
});

module.exports = router;
