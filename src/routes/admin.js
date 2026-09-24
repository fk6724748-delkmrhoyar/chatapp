// CK Chat (Node) - port of ckmr/ admin panel
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { q, q1, run, setting, setSetting } = require('../db');
const { requireAdmin } = require('../auth');
const { upload, uploadedUrl, usernameSlug, e } = require('../helpers');
const { sendOtpEmail, otpMailerLastError } = require('../mailer');

const anyUpload = upload.any();

// ---- login.php -> /ckmr/login ----
router.get('/login', (req, res) => {
  res.render('admin/login', { err: '' });
});

router.post('/login', async (req, res, next) => {
  try {
    const id = req.body.id || '';
    const pw = req.body.password || '';
    const a = await q1('SELECT * FROM admins WHERE username=? OR email=?', [id, id]);
    if (a && a.password && bcrypt.compareSync(String(pw), a.password)) {
      req.session.aid = a.id;
      return res.redirect('/ckmr/');
    }
    res.render('admin/login', { err: 'Invalid credentials' });
  } catch (err) { next(err); }
});

// ---- logout.php -> /ckmr/logout ----
router.get('/logout', (req, res) => {
  delete req.session.aid;
  res.redirect('/ckmr/login');
});

// everything below requires admin session (_guard.php)
router.use(requireAdmin());

// ---- index.php -> /ckmr/ ----
router.get('/', async (req, res, next) => {
  try {
    const totalUsers = (await q1('SELECT COUNT(*) c FROM users')).c;
    const totalMsgs = (await q1('SELECT COUNT(*) c FROM messages')).c;
    const activeChats = (await q1(
      "SELECT COUNT(DISTINCT LEAST(sender_id,IFNULL(receiver_id,0)),GREATEST(sender_id,IFNULL(receiver_id,0))) c FROM messages WHERE receiver_id IS NOT NULL"
    )).c;
    res.render('admin/index', { totalUsers, totalMsgs, activeChats });
  } catch (err) { next(err); }
});

// ---- users.php -> /ckmr/users ----
router.get('/users', async (req, res, next) => {
  try {
    if (req.query.ban !== undefined) {
      await run('UPDATE users SET banned=1 WHERE id=?', [parseInt(req.query.ban, 10) || 0]);
      return res.redirect('/ckmr/users');
    }
    if (req.query.unban !== undefined) {
      await run('UPDATE users SET banned=0 WHERE id=?', [parseInt(req.query.unban, 10) || 0]);
      return res.redirect('/ckmr/users');
    }
    if (req.query.clear !== undefined) {
      const id = parseInt(req.query.clear, 10) || 0;
      await run('DELETE FROM messages WHERE sender_id=? OR receiver_id=?', [id, id]);
      return res.redirect('/ckmr/users');
    }
    if (req.query.grant_tick !== undefined) {
      await run('UPDATE users SET blue_tick=1 WHERE id=?', [parseInt(req.query.grant_tick, 10) || 0]);
      return res.redirect('/ckmr/users');
    }
    if (req.query.revoke_tick !== undefined) {
      await run('UPDATE users SET blue_tick=0 WHERE id=?', [parseInt(req.query.revoke_tick, 10) || 0]);
      return res.redirect('/ckmr/users');
    }
    if (req.query.revoke_ch !== undefined) {
      await run('UPDATE channels SET blue_tick=0 WHERE id=?', [parseInt(req.query.revoke_ch, 10) || 0]);
      return res.redirect('/ckmr/users');
    }

    const q_ = String(req.query.q || '').trim();
    const users = q_
      ? await q('SELECT * FROM users WHERE name LIKE ? OR username LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY id DESC',
          Array(4).fill('%' + q_ + '%'))
      : await q('SELECT * FROM users ORDER BY id DESC LIMIT 200');

    res.render('admin/users', { users, q: q_, query: req.query, grant_msg: '' });
  } catch (err) { next(err); }
});

router.post('/users', async (req, res, next) => {
  try {
    if (req.body.grant_username !== undefined) {
      const raw = String(req.body.grant_username || '').trim();
      let grant_msg = '';
      if (raw !== '') {
        const uname = usernameSlug(raw);
        const like = '%' + raw + '%';
        try {
          const hit = await q1(
            `SELECT id,name,username,email FROM users WHERE
             LOWER(username)=LOWER(?) OR LOWER(email)=LOWER(?) OR LOWER(name)=LOWER(?)
             OR LOWER(username)=LOWER(?) OR username LIKE ? OR email LIKE ? OR name LIKE ?
             ORDER BY id ASC LIMIT 1`,
            [raw, raw, raw, uname, like, like, like]
          );
          if (hit) {
            await run('UPDATE users SET blue_tick=1 WHERE id=?', [hit.id]);
            return res.redirect('/ckmr/users?granted=' + encodeURIComponent(hit.name || hit.email));
          }
          grant_msg = `No user matched "${e(raw)}". Try the exact username, email, or name.`;
        } catch (err2) {
          grant_msg = 'DB error: ' + e(err2.message);
        }
      }
      const q_ = '';
      const users = await q('SELECT * FROM users ORDER BY id DESC LIMIT 200');
      return res.render('admin/users', { users, q: q_, query: req.query, grant_msg });
    }
    if (req.body.grant_channel !== undefined) {
      const cn = String(req.body.grant_channel || '').trim();
      let grant_msg = '';
      if (cn !== '') {
        const like = '%' + cn + '%';
        try {
          const hit = await q1('SELECT id,name FROM channels WHERE LOWER(name)=LOWER(?) OR name LIKE ? ORDER BY id ASC LIMIT 1', [cn, like]);
          if (hit) {
            await run('UPDATE channels SET blue_tick=1 WHERE id=?', [hit.id]);
            return res.redirect('/ckmr/users?cgranted=' + encodeURIComponent(hit.name));
          }
          grant_msg = `No channel matched "${e(cn)}".`;
        } catch (err2) {
          grant_msg = 'DB error: ' + e(err2.message);
        }
      }
      const q_ = '';
      const users = await q('SELECT * FROM users ORDER BY id DESC LIMIT 200');
      return res.render('admin/users', { users, q: q_, query: req.query, grant_msg });
    }
    res.redirect('/ckmr/users');
  } catch (err) { next(err); }
});

// ---- channels.php -> /ckmr/channels ----
router.get('/channels', async (req, res, next) => {
  try {
    if (req.query.ban !== undefined) {
      await run('UPDATE channels SET banned=1 WHERE id=?', [parseInt(req.query.ban, 10) || 0]);
      return res.redirect('/ckmr/channels');
    }
    if (req.query.unban !== undefined) {
      await run('UPDATE channels SET banned=0 WHERE id=?', [parseInt(req.query.unban, 10) || 0]);
      return res.redirect('/ckmr/channels');
    }
    const q_ = String(req.query.q || '').trim();
    const chans = q_
      ? await q('SELECT c.*,u.email owner_email FROM channels c LEFT JOIN users u ON u.id=c.owner_id WHERE c.name LIKE ? ORDER BY c.id DESC', ['%' + q_ + '%'])
      : await q('SELECT c.*,u.email owner_email FROM channels c LEFT JOIN users u ON u.id=c.owner_id ORDER BY c.id DESC LIMIT 200');
    res.render('admin/channels', { chans, q: q_ });
  } catch (err) { next(err); }
});

// ---- reports.php -> /ckmr/reports ----
router.get('/reports', async (req, res, next) => {
  try {
    const rows = await q(
      "SELECT r.*,u1.email reporter,u2.email target FROM reports r LEFT JOIN users u1 ON u1.id=r.reporter_id LEFT JOIN users u2 ON u2.id=r.target_id ORDER BY r.id DESC"
    );
    res.render('admin/reports', { rows });
  } catch (err) { next(err); }
});

// ---- requests.php -> /ckmr/requests ----
router.get('/requests', async (req, res, next) => {
  try {
    if (req.query.approve !== undefined) {
      const id = parseInt(req.query.approve, 10) || 0;
      const r = await q1('SELECT * FROM verify_requests WHERE id=?', [id]);
      if (r) {
        if (r.target_type === 'user') await run('UPDATE users SET blue_tick=1 WHERE id=?', [r.user_id]);
        else await run('UPDATE channels SET blue_tick=1 WHERE name=?', [r.target_name]);
        await run("UPDATE verify_requests SET status='approved' WHERE id=?", [id]);
      }
      return res.redirect('/ckmr/requests');
    }
    if (req.query.reject !== undefined) {
      await run("UPDATE verify_requests SET status='rejected' WHERE id=?", [parseInt(req.query.reject, 10) || 0]);
      return res.redirect('/ckmr/requests');
    }
    const rows = await q('SELECT * FROM verify_requests ORDER BY id DESC');
    res.render('admin/requests', { rows });
  } catch (err) { next(err); }
});

// ---- verify.php -> /ckmr/verify ----
router.get('/verify', async (req, res, next) => {
  try {
    if (req.query.remove_u !== undefined) {
      await run('UPDATE users SET blue_tick=0,blue_tick_expires=NULL WHERE id=?', [parseInt(req.query.remove_u, 10) || 0]);
      return res.redirect('/ckmr/verify');
    }
    if (req.query.remove_c !== undefined) {
      await run('UPDATE channels SET blue_tick=0 WHERE id=?', [parseInt(req.query.remove_c, 10) || 0]);
      return res.redirect('/ckmr/verify');
    }
    const users = await q('SELECT * FROM users WHERE blue_tick=1');
    const chans = await q('SELECT * FROM channels WHERE blue_tick=1');
    res.render('admin/verify', { users, chans });
  } catch (err) { next(err); }
});

router.post('/verify', async (req, res, next) => {
  try {
    const type = req.body.type;
    const id = parseInt(req.body.target_id, 10) || 0;
    const dur = req.body.duration;
    let exp = null;
    const now = new Date();
    if (dur === '1m') exp = addMonths(now, 1);
    if (dur === '3m') exp = addMonths(now, 3);
    if (dur === '6m') exp = addMonths(now, 6);
    if (type === 'user') await run('UPDATE users SET blue_tick=1, blue_tick_expires=? WHERE id=?', [exp, id]);
    else await run('UPDATE channels SET blue_tick=1 WHERE id=?', [id]);
    res.redirect('/ckmr/verify');
  } catch (err) { next(err); }
});
function addMonths(d, n) {
  const dt = new Date(d.getTime());
  dt.setMonth(dt.getMonth() + n);
  const pad = (v) => String(v).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}

// ---- support.php -> /ckmr/support ----
router.get('/support', async (req, res, next) => {
  try {
    const rows = await q('SELECT * FROM support_tickets ORDER BY id DESC');
    res.render('admin/support', { rows });
  } catch (err) { next(err); }
});

router.post('/support', async (req, res, next) => {
  try {
    await run("UPDATE support_tickets SET reply=?,status='answered',replied_at=NOW() WHERE id=?", [
      String(req.body.reply || '').trim(), parseInt(req.body.id, 10) || 0,
    ]);
    res.redirect('/ckmr/support');
  } catch (err) { next(err); }
});

// ---- payments.php -> /ckmr/payments ----
router.get('/payments', (req, res) => {
  res.render('admin/payments', { query: req.query });
});

router.post('/payments', async (req, res, next) => {
  try {
    for (const k of ['easypaisa', 'jazzcash', 'binance', 'verify_price']) {
      await setSetting(k, req.body[k] || '');
    }
    res.redirect('/ckmr/payments?ok=1');
  } catch (err) { next(err); }
});

// ---- ads.php -> /ckmr/ads ----
router.get('/ads', async (req, res, next) => {
  try {
    if (req.query.del !== undefined) {
      await run('DELETE FROM ads WHERE id=?', [parseInt(req.query.del, 10) || 0]);
      return res.redirect('/ckmr/ads');
    }
    const ads = await q('SELECT * FROM ads ORDER BY id DESC');
    res.render('admin/ads', { ads });
  } catch (err) { next(err); }
});

router.post('/ads', anyUpload, async (req, res, next) => {
  try {
    const b = req.body || {};
    let img = null, vid = null;
    const files = Array.isArray(req.files) ? req.files : [];
    const mediaFile = files.find((f) => f.fieldname === 'media');
    if (mediaFile) {
      const ext = (mediaFile.originalname.split('.').pop() || '').toLowerCase();
      if (['mp4', 'mov', 'webm', 'm4v', '3gp'].includes(ext)) vid = '/uploads/' + mediaFile.filename;
      else img = '/uploads/' + mediaFile.filename;
    }
    const title = String(b.title || '').trim();
    await run(
      'INSERT INTO ads (image,video,title,caption,expires_at) VALUES (?,?,?,?,DATE_ADD(NOW(),INTERVAL 24 HOUR))',
      [img, vid, title, b.caption]
    );
    res.redirect('/ckmr/ads');
  } catch (err) { next(err); }
});

// ---- broadcast.php -> /ckmr/broadcast ----
router.get('/broadcast', (req, res) => {
  res.render('admin/broadcast', { sent: false });
});

router.post('/broadcast', anyUpload, async (req, res, next) => {
  try {
    const b = req.body || {};
    const body = String(b.body || '').trim();
    const target = b.target;
    const brName = setting('broadcast_name', 'CK Chat');
    let bot = (await q1("SELECT id FROM users WHERE email='broadcast@ck.system'")) || null;
    let botId;
    if (!bot) {
      const r = await run("INSERT INTO users (email,name,blue_tick) VALUES ('broadcast@ck.system',?,1)", [brName]);
      botId = r.insertId;
    } else {
      botId = bot.id;
      await run('UPDATE users SET name=?,blue_tick=1 WHERE id=?', [brName, botId]);
    }
    const attach = uploadedUrl(req, 'attachment');
    let sent = false;
    if (body !== '' || attach) {
      if (target === 'all') {
        const ids = await q('SELECT id FROM users WHERE id<>?', [botId]);
        for (const row of ids) {
          await run('INSERT INTO messages (sender_id,receiver_id,body,attachment,is_broadcast) VALUES (?,?,?,?,1)', [botId, row.id, body, attach || null]);
        }
      } else {
        const uid = parseInt(b.user_id, 10) || 0;
        await run('INSERT INTO messages (sender_id,receiver_id,body,attachment,is_broadcast) VALUES (?,?,?,?,1)', [botId, uid, body, attach || null]);
      }
      sent = true;
    }
    res.render('admin/broadcast', { sent });
  } catch (err) { next(err); }
});

// ---- settings.php -> /ckmr/settings ----
async function saveSettingsFromPost(req) {
  const b = req.body || {};
  const logo = uploadedUrl(req, 'app_logo');
  const blogo = uploadedUrl(req, 'broadcast_logo');
  await setSetting('app_name', b.app_name || '');
  await setSetting('support_link', b.support_link || '');
  await setSetting('broadcast_name', b.broadcast_name || '');
  await setSetting('smtp_host', String(b.smtp_host || 'smtp.hostinger.com').trim());
  await setSetting('smtp_port', String(b.smtp_port || '465').trim());
  await setSetting('smtp_secure', b.smtp_secure || 'ssl');
  await setSetting('smtp_user', String(b.smtp_user || 'support@777sc.site').trim());
  const smtpPass = String(b.smtp_pass || '').trim();
  if (smtpPass !== '') await setSetting('smtp_pass', smtpPass);
  await setSetting('smtp_from', String(b.smtp_from || 'support@777sc.site').trim());
  await setSetting('smtp_from_name', String(b.smtp_from_name || b.app_name || 'CK Chat').trim());
  if (logo) await setSetting('app_logo', logo);
  if (blogo) await setSetting('broadcast_logo', blogo);
}

router.get('/settings', (req, res) => {
  res.render('admin/settings', { query: req.query, test_msg: '' });
});

router.post('/settings', anyUpload, async (req, res, next) => {
  try {
    if (req.body.send_test_smtp !== undefined) {
      await saveSettingsFromPost(req);
      const to = String(req.body.test_email || '').trim();
      const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let test_msg = '';
      if (EMAIL_RE.test(to)) {
        const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
        const appName = req.body.app_name || setting('app_name', 'CK Chat');
        const ok = await sendOtpEmail(to, code, appName);
        const err2 = otpMailerLastError();
        test_msg = ok ? `Test email sent to ${to} (code ${code}).` : 'Failed to send test email. ' + (err2 || 'Check SMTP settings/logs.');
      } else {
        test_msg = 'Enter a valid test email address.';
      }
      return res.render('admin/settings', { query: req.query, test_msg });
    }
    await saveSettingsFromPost(req);
    res.redirect('/ckmr/settings?ok=1');
  } catch (err) { next(err); }
});

// ---- account.php -> /ckmr/account ----
router.get('/account', async (req, res, next) => {
  try {
    const a = await q1('SELECT * FROM admins WHERE id=?', [req.session.aid]);
    res.render('admin/account', { a, query: req.query });
  } catch (err) { next(err); }
});

router.post('/account', async (req, res, next) => {
  try {
    const a = await q1('SELECT * FROM admins WHERE id=?', [req.session.aid]);
    const u = req.body.username, em = req.body.email, pw = req.body.password;
    if (pw) {
      await run('UPDATE admins SET username=?,email=?,password=? WHERE id=?', [u, em, bcrypt.hashSync(String(pw), 10), a.id]);
    } else {
      await run('UPDATE admins SET username=?,email=? WHERE id=?', [u, em, a.id]);
    }
    res.redirect('/ckmr/account?ok=1');
  } catch (err) { next(err); }
});

module.exports = router;
