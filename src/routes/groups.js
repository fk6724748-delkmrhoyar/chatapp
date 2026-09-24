// Group chat routes: mirrors group_chat.php, group_new.php, group_profile.php
const express = require('express');
const router = express.Router();
const { q, q1, run } = require('../db');
const { requireLogin } = require('../auth');
const { upload, uploadedUrl } = require('../helpers');

router.use(requireLogin());

// group_new.php -> /group/new
router.get('/group/new', (req, res) => {
  res.render('group_new');
});

router.post('/group/new', upload.any(), async (req, res) => {
  const me = req.me;
  const av = uploadedUrl(req, 'avatar');
  const result = await run(
    'INSERT INTO groups_tbl (name,description,avatar,owner_id) VALUES (?,?,?,?)',
    [req.body.name, req.body.description || '', av || null, me.id]
  );
  const gid = result.insertId;
  await run('INSERT INTO group_members (group_id,user_id,is_admin) VALUES (?,?,1)', [gid, me.id]);
  res.redirect('/chats');
});

// group_chat.php -> /group/:id
router.get('/group/:id', async (req, res) => {
  const me = req.me;
  const gid = parseInt(req.params.id, 10) || 0;
  const g = await q1(
    `SELECT g.*,gm.is_admin FROM groups_tbl g JOIN group_members gm ON gm.group_id=g.id WHERE g.id=? AND gm.user_id=?`,
    [gid, me.id]
  );
  if (!g) return res.redirect('/chats');

  const msgs = await q(
    `SELECT m.*,u.name,u.username,u.email FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.group_id=? ORDER BY m.id ASC`,
    [gid]
  );
  const memberCountRow = await q1('SELECT COUNT(*) AS c FROM group_members WHERE group_id=?', [gid]);
  const memberCount = memberCountRow.c;

  // mark group as read for this user (up to newest message)
  let lastId = 0;
  for (const mm of msgs) if (mm.id > lastId) lastId = mm.id;
  try {
    await run(
      'INSERT INTO group_reads (group_id,user_id,last_msg_id) VALUES (?,?,?) ON DUPLICATE KEY UPDATE last_msg_id=GREATEST(last_msg_id,VALUES(last_msg_id))',
      [gid, me.id, lastId]
    );
  } catch (e) { /* ignore */ }

  res.render('group_chat', { g, gid, msgs, memberCount });
});

router.post('/group/:id', upload.any(), async (req, res) => {
  const me = req.me;
  const gid = parseInt(req.params.id, 10) || 0;
  const g = await q1(
    `SELECT g.*,gm.is_admin FROM groups_tbl g JOIN group_members gm ON gm.group_id=g.id WHERE g.id=? AND gm.user_id=?`,
    [gid, me.id]
  );
  if (!g) return res.redirect('/chats');

  const body = String(req.body.body || '').trim();
  const att = uploadedUrl(req, 'attachment');
  if ((body || att) && (!g.only_admin_msg || g.is_admin)) {
    await run(
      'INSERT INTO messages (sender_id,group_id,body,attachment) VALUES (?,?,?,?)',
      [me.id, gid, body, att || null]
    );
  }
  res.redirect('/group/' + gid);
});

// group_profile.php -> /group/:id/profile
router.get('/group/:id/profile', async (req, res) => {
  const me = req.me;
  const gid = parseInt(req.params.id, 10) || 0;
  const g = await q1(
    `SELECT g.*,gm.is_admin FROM groups_tbl g JOIN group_members gm ON gm.group_id=g.id WHERE g.id=? AND gm.user_id=?`,
    [gid, me.id]
  );
  if (!g) return res.redirect('/chats');
  const isOwner = g.owner_id == me.id;
  const isAdmin = !!g.is_admin || isOwner;

  const members = await q(
    `SELECT u.*,gm.is_admin FROM group_members gm JOIN users u ON u.id=gm.user_id WHERE gm.group_id=? ORDER BY gm.is_admin DESC, u.name`,
    [gid]
  );
  const addq = String(req.query.addq || '').trim();
  let nonMembers = [];
  if (addq !== '') {
    const like = '%' + addq + '%';
    nonMembers = await q(
      `SELECT id,name,username,email,avatar FROM users WHERE banned=0 AND IFNULL(is_private,0)=0
       AND id NOT IN (SELECT user_id FROM group_members WHERE group_id=?)
       AND (name LIKE ? OR username LIKE ? OR email LIKE ? OR phone LIKE ?)
       ORDER BY name LIMIT 20`,
      [gid, like, like, like, like]
    );
  }
  const flashErr = req.session.flash_err || '';
  delete req.session.flash_err;

  res.render('group_profile', { g, gid, isOwner, isAdmin, members, addq, nonMembers, flashErr });
});

router.post('/group/:id/profile', upload.any(), async (req, res) => {
  const me = req.me;
  const gid = parseInt(req.params.id, 10) || 0;
  const g = await q1(
    `SELECT g.*,gm.is_admin FROM groups_tbl g JOIN group_members gm ON gm.group_id=g.id WHERE g.id=? AND gm.user_id=?`,
    [gid, me.id]
  );
  if (!g) return res.redirect('/chats');
  const isOwner = g.owner_id == me.id;
  const isAdmin = !!g.is_admin || isOwner;
  const action = req.body.action || '';

  if (action === 'add' && isAdmin) {
    const uid = parseInt(req.body.user_id, 10) || 0;
    if (uid) {
      const cntRow = await q1('SELECT COUNT(*) AS c FROM group_members WHERE group_id=?', [gid]);
      if (cntRow.c >= 1000) {
        req.session.flash_err = 'Group limit full (1000 members max).';
      } else {
        const priv = await q1('SELECT is_private FROM users WHERE id=?', [uid]);
        if (priv && priv.is_private) {
          req.session.flash_err = 'This user has a private account and cannot be added to groups.';
        } else {
          await run('INSERT IGNORE INTO group_members (group_id,user_id) VALUES (?,?)', [gid, uid]);
        }
      }
    }
  }
  if (action === 'remove' && isAdmin) {
    const uid = parseInt(req.body.user_id, 10) || 0;
    if (uid && uid != g.owner_id) {
      await run('DELETE FROM group_members WHERE group_id=? AND user_id=?', [gid, uid]);
    }
  }
  if (action === 'set_perm' && isAdmin) {
    const only = req.body.only_admin_msg !== undefined ? 1 : 0;
    await run('UPDATE groups_tbl SET only_admin_msg=? WHERE id=?', [only, gid]);
  }
  if (action === 'edit' && isOwner) {
    const name = String(req.body.name || g.name).trim();
    const desc = String(req.body.description || g.description).trim();
    const av = uploadedUrl(req, 'avatar') || g.avatar;
    await run('UPDATE groups_tbl SET name=?,description=?,avatar=? WHERE id=?', [name, desc, av, gid]);
  }
  if (action === 'leave') {
    if (isOwner) {
      const next = await q1(
        'SELECT user_id FROM group_members WHERE group_id=? AND user_id<>? ORDER BY is_admin DESC, user_id ASC LIMIT 1',
        [gid, me.id]
      );
      const newOwner = next ? next.user_id : null;
      if (newOwner) {
        await run('UPDATE groups_tbl SET owner_id=? WHERE id=?', [newOwner, gid]);
        await run('UPDATE group_members SET is_admin=1 WHERE group_id=? AND user_id=?', [gid, newOwner]);
      } else {
        await run('DELETE FROM groups_tbl WHERE id=?', [gid]);
        await run('DELETE FROM messages WHERE group_id=?', [gid]);
      }
    }
    await run('DELETE FROM group_members WHERE group_id=? AND user_id=?', [gid, me.id]);
    await run('INSERT INTO group_left_log (group_id,user_id) VALUES (?,?)', [gid, me.id]);
    return res.redirect('/chats');
  }
  res.redirect('/group/' + gid + '/profile');
});

module.exports = router;
