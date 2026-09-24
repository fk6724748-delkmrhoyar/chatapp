// CK Chat (Node) - session / login helpers (mirrors PHP remember_login etc.)
const crypto = require('crypto');
const { q1, run } = require('./db');

const YEAR = 365 * 24 * 60 * 60 * 1000;

async function rememberLogin(res, uid) {
  const token = crypto.randomBytes(24).toString('hex');
  await run('UPDATE users SET remember_token=? WHERE id=?', [token, uid]);
  res.cookie('ck_remember', uid + ':' + token, {
    maxAge: YEAR, httpOnly: true, sameSite: 'lax', path: '/',
  });
}

async function forgetLogin(req, res) {
  if (req.session && req.session.uid) {
    try { await run('UPDATE users SET remember_token=NULL WHERE id=?', [req.session.uid]); } catch (e) {}
  }
  res.clearCookie('ck_remember', { path: '/' });
}

// restores session from remember cookie
async function tryRememberLogin(req) {
  if (req.session.uid) return;
  const c = req.cookies && req.cookies.ck_remember;
  if (!c) return;
  const [idStr, tok] = String(c).split(':');
  const uid = parseInt(idStr, 10);
  if (!uid || !tok) return;
  const u = await q1('SELECT id, remember_token, banned FROM users WHERE id=?', [uid]);
  if (u && !u.banned && u.remember_token && u.remember_token === tok) req.session.uid = u.id;
}

async function currentUser(req) {
  if (!req.session.uid) return null;
  return q1('SELECT * FROM users WHERE id=?', [req.session.uid]);
}

// express middleware: loads req.me, redirects to / when logged out or banned
function requireLogin() {
  return async (req, res, next) => {
    try {
      const me = await currentUser(req);
      if (!me || me.banned) {
        await forgetLogin(req, res);
        req.session.destroy(() => res.redirect('/?step=email'));
        return;
      }
      req.me = me;
      res.locals.me = me;
      // update_seen()
      await run('UPDATE users SET last_seen=NOW() WHERE id=?', [me.id]);
      await run('UPDATE messages SET delivered=1 WHERE receiver_id=? AND delivered=0', [me.id]);
      next();
    } catch (err) { next(err); }
  };
}

function requireAdmin() {
  return (req, res, next) => {
    if (!req.session.aid) return res.redirect('/ckmr/login');
    next();
  };
}

module.exports = { rememberLogin, forgetLogin, tryRememberLogin, currentUser, requireLogin, requireAdmin };
