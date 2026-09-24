// CK Chat (Node) - login / signup / OTP flow (port of index.php + profile_setup.php + logout.php)
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { q1, run } = db;
const { upload, uploadedUrl, usernameSlug } = require('../helpers');
const { rememberLogin, forgetLogin, currentUser, requireLogin } = require('../auth');
const { sendOtpEmail, otpMailerLastError } = require('../mailer');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const anyUpload = upload.any();

function otpErrorMessage() {
  const d = (otpMailerLastError() || '').trim();
  return 'OTP email could not be sent. ' + (d || 'Please check SMTP settings and try again.');
}
function secondsUntilResend(s) {
  return Math.max(0, Math.floor((s.otp_last_sent_at || 0) + 30 - Date.now() / 1000));
}
async function createAndSendOtp(s, email, appName) {
  delete s.otp_code; delete s.otp_email; delete s.otp_expires; delete s.otp_verified; delete s.otp_attempts;
  const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  if (!(await sendOtpEmail(email, code, appName))) return false;
  s.otp_code = code;
  s.otp_email = email;
  s.otp_expires = Math.floor(Date.now() / 1000) + 600;
  s.otp_attempts = 0;
  s.otp_last_sent_at = Math.floor(Date.now() / 1000);
  return true;
}

function renderAuth(req, res, step, error) {
  res.render('auth', {
    step,
    error: error || '',
    signupEmail: req.session.pending_email || '',
    resendWait: secondsUntilResend(req.session),
    app_name: res.locals.app_name,
    app_logo: res.locals.app_logo,
  });
}

router.get('/', async (req, res) => {
  if (req.session.uid) return res.redirect('/chats');
  renderAuth(req, res, req.query.step || 'welcome', '');
});

router.post('/auth', anyUpload, async (req, res, next) => {
  try {
    const s = req.session;
    const b = req.body || {};
    const mode = b.mode || '';
    const appName = res.locals.app_name;
    const email = String(b.email || '').trim();

    if (mode === 'email') {
      if (!EMAIL_RE.test(email)) return renderAuth(req, res, 'email', 'Enter a valid email.');
      const u = await q1('SELECT * FROM users WHERE email=?', [email]);
      s.pending_email = email;
      if (u) {
        if (u.banned) return renderAuth(req, res, 'email', 'This account is banned.');
        if (!u.password) { s.set_pwd_uid = u.id; return res.redirect('/?step=setpwd'); }
        return res.redirect('/?step=password');
      }
      if (await createAndSendOtp(s, email, appName)) return res.redirect('/?step=otp');
      delete s.otp_code; delete s.otp_email; delete s.otp_expires; delete s.otp_verified;
      delete s.otp_attempts; delete s.otp_last_sent_at;
      return renderAuth(req, res, 'email', otpErrorMessage());
    }

    if (mode === 'otp') {
      const entered = String(b.otp || '').replace(/\D/g, '');
      if ((s.otp_email || '') !== (s.pending_email || '#')) return res.redirect('/?step=email');
      if (Date.now() / 1000 > (s.otp_expires || 0)) return renderAuth(req, res, 'otp', 'Code expired. Request a new one.');
      if ((s.otp_attempts || 0) >= 5) return renderAuth(req, res, 'otp', 'Too many attempts. Request a new code.');
      if (entered !== (s.otp_code || '___')) {
        s.otp_attempts = (s.otp_attempts || 0) + 1;
        return renderAuth(req, res, 'otp', 'Wrong code. Try again.');
      }
      s.otp_verified = s.otp_email;
      return res.redirect('/?step=signup');
    }

    if (mode === 'resend') {
      const em = s.pending_email || '';
      const wait = secondsUntilResend(s);
      if (wait > 0) return renderAuth(req, res, 'otp', 'Please wait ' + wait + ' seconds before resending OTP.');
      if (!EMAIL_RE.test(em)) return res.redirect('/?step=email');
      if (!(await createAndSendOtp(s, em, appName))) return renderAuth(req, res, 'otp', otpErrorMessage());
      return res.redirect('/?step=otp');
    }

    if (mode === 'login') {
      const em = s.pending_email || '';
      const u = await q1('SELECT * FROM users WHERE email=?', [em]);
      if (!u) return res.redirect('/?step=email');
      if (u.banned) return renderAuth(req, res, 'password', 'This account is banned.');
      if (!u.password || !bcrypt.compareSync(String(b.password || ''), u.password)) {
        return renderAuth(req, res, 'password', 'Wrong password.');
      }
      s.uid = u.id; delete s.pending_email;
      await rememberLogin(res, u.id);
      if (!u.name || !u.username) return res.redirect('/profile-setup');
      return res.redirect('/chats');
    }

    if (mode === 'setpwd') {
      const uid = parseInt(s.set_pwd_uid || 0, 10);
      if (!uid) return res.redirect('/?step=email');
      const pwd = String(b.password || ''), rp = String(b.repassword || '');
      if (pwd.length < 6) return renderAuth(req, res, 'setpwd', 'Password must be at least 6 characters.');
      if (pwd !== rp) return renderAuth(req, res, 'setpwd', 'Passwords do not match.');
      await run('UPDATE users SET password=? WHERE id=?', [bcrypt.hashSync(pwd, 10), uid]);
      s.uid = uid; delete s.set_pwd_uid; delete s.pending_email;
      await rememberLogin(res, uid);
      return res.redirect('/chats');
    }

    if (mode === 'signup') {
      const em = s.pending_email || '';
      if ((s.otp_verified || '') !== em || !em) return res.redirect('/?step=email');
      const username = usernameSlug(b.username || '');
      const name = String(b.name || '').trim();
      const phone = String(b.phone || '').trim();
      const about = String(b.about || '').trim() || "Hey there! I'm using CK Chat";
      const pwd = String(b.password || ''), rpwd = String(b.repassword || '');
      let error = '';
      if (!EMAIL_RE.test(em)) error = 'Invalid email.';
      else if (username.length < 3) error = 'Username must be at least 3 characters.';
      else if (!name) error = 'Name is required.';
      else if (pwd.length < 6) error = 'Password must be at least 6 characters.';
      else if (pwd !== rpwd) error = 'Passwords do not match.';
      else {
        const dup = await q1('SELECT id FROM users WHERE username=? OR email=? LIMIT 1', [username, em]);
        if (dup) error = 'Username or email already used.';
        else {
          const avatar = uploadedUrl(req, 'avatar');
          const r = await run(
            'INSERT INTO users (email,password,username,name,phone,about,avatar) VALUES (?,?,?,?,?,?,?)',
            [em, bcrypt.hashSync(pwd, 10), username, name, phone, about, avatar]
          );
          s.uid = r.insertId;
          delete s.pending_email; delete s.otp_code; delete s.otp_email; delete s.otp_expires;
          delete s.otp_verified; delete s.otp_attempts; delete s.otp_last_sent_at;
          await rememberLogin(res, r.insertId);
          return res.redirect('/chats');
        }
      }
      return renderAuth(req, res, 'signup', error);
    }

    return res.redirect('/');
  } catch (err) { next(err); }
});

// ---- profile setup (profile_setup.php) ----
router.get('/profile-setup', requireLogin(), (req, res) => {
  res.render('profile_setup', { title: 'Profile setup', error: '', tab: '' });
});

router.post('/profile-setup', requireLogin(), anyUpload, async (req, res, next) => {
  try {
    const b = req.body || {};
    const username = usernameSlug(b.username || '');
    const name = String(b.name || '').trim();
    const about = String(b.about || '').trim() || "Hey there! I'm using CK Chat";
    const phone = String(b.phone || '').trim();
    if (username.length < 3 || !name) {
      return res.render('profile_setup', { title: 'Profile setup', error: 'Name and username (min 3 chars) are required.', tab: '' });
    }
    const dup = await q1('SELECT id FROM users WHERE username=? AND id<>? LIMIT 1', [username, req.me.id]);
    if (dup) return res.render('profile_setup', { title: 'Profile setup', error: 'Username already taken.', tab: '' });
    const avatar = uploadedUrl(req, 'avatar');
    if (avatar) await run('UPDATE users SET avatar=? WHERE id=?', [avatar, req.me.id]);
    await run('UPDATE users SET name=?, username=?, about=?, phone=? WHERE id=?', [name, username, about, phone, req.me.id]);
    res.redirect('/chats');
  } catch (err) { next(err); }
});

router.get('/logout', async (req, res) => {
  await forgetLogin(req, res);
  req.session.destroy(() => res.redirect('/?step=email'));
});

module.exports = router;
