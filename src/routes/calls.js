// CK Chat (Node) - calls.php + call.php port
const express = require('express');
const router = express.Router();
const { q, q1, run } = require('../db');
const { requireLogin } = require('../auth');
const { isOnline } = require('../helpers');

async function logCallMessage(call) {
  if (call.logged) return;
  const type = call.type || 'voice';
  const icon = type === 'video' ? '📹' : '📞';
  const label = type === 'video' ? 'Video call' : 'Voice call';
  let body;
  if (call.status === 'answered' || (call.answered_at && Number(call.duration) > 0)) {
    let d = Number(call.duration) || 0;
    if (d <= 0 && call.answered_at) {
      d = Math.max(0, Math.floor((Date.now() - new Date(String(call.answered_at).replace(' ', 'T')).getTime()) / 1000));
    }
    const m = Math.floor(d / 60), s = d % 60;
    const dur = m + ':' + String(s).padStart(2, '0');
    body = icon + ' ' + label + ' · ' + dur;
  } else {
    body = icon + ' Missed ' + label.toLowerCase();
  }
  try {
    await run('INSERT INTO messages (sender_id,receiver_id,body,delivered) VALUES (?,?,?,1)', [call.caller_id, call.callee_id, body]);
    await run('UPDATE calls SET logged=1 WHERE id=?', [call.id]);
  } catch (e) { /* ignore */ }
}

router.get('/calls', requireLogin(), async (req, res, next) => {
  try {
    const me = req.me;
    try { await run('UPDATE users SET calls_seen_at=NOW() WHERE id=?', [me.id]); } catch (e) {}
    const calls = await q(
      `SELECT c.*,u.name,u.avatar,u.email FROM calls c JOIN users u ON u.id=IF(c.caller_id=?,c.callee_id,c.caller_id)
       WHERE c.caller_id=? OR c.callee_id=? ORDER BY c.id DESC LIMIT 100`,
      [me.id, me.id, me.id]
    );
    res.render('calls', { tab: 'calls', calls, me });
  } catch (err) { next(err); }
});

// ---------------- WebRTC / call JSON API ----------------
router.all('/call/ajax', requireLogin(), async (req, res, next) => {
  try {
    const me = req.me;
    const action = req.query.action || req.body.action || '';

    if (action === 'start') {
      const uid = parseInt(req.body.with ?? req.query.with ?? 0, 10) || 0;
      let type = req.body.type ?? req.query.type ?? 'voice';
      if (!['voice', 'video'].includes(type)) type = 'voice';
      const peer = await q1('SELECT id,name,email,avatar,last_seen FROM users WHERE id=?', [uid]);
      if (!peer) return res.json({ ok: false, error: 'no user' });
      const r = await run("INSERT INTO calls (caller_id,callee_id,type,status) VALUES (?,?,?,'no_answer')", [me.id, uid, type]);
      return res.json({ ok: true, id: r.insertId });
    }

    if (action === 'poll') {
      const id = parseInt(req.query.id || 0, 10);
      const c = await q1('SELECT * FROM calls WHERE id=?', [id]);
      if (!c) return res.json({ ok: false });
      let secs = 0;
      if (c.status === 'answered' && c.answered_at) {
        secs = Math.max(0, Math.floor((Date.now() - new Date(String(c.answered_at).replace(' ', 'T')).getTime()) / 1000));
      }
      const ended = !!c.ended_at || c.status === 'ended';
      return res.json({ ok: true, status: c.status, duration: c.duration, seconds: secs, answered_at: c.answered_at, ended });
    }

    if (action === 'accept') {
      const id = parseInt(req.body.id ?? req.query.id ?? 0, 10);
      await run("UPDATE calls SET status='answered', answered_at=NOW() WHERE id=? AND callee_id=? AND status='no_answer'", [id, me.id]);
      return res.json({ ok: true });
    }

    if (action === 'reject') {
      const id = parseInt(req.body.id ?? req.query.id ?? 0, 10);
      await run("UPDATE calls SET status='missed', ended_at=NOW() WHERE id=? AND (caller_id=? OR callee_id=?) AND status='no_answer'", [id, me.id, me.id]);
      const c = await q1('SELECT * FROM calls WHERE id=?', [id]);
      if (c) await logCallMessage(c);
      return res.json({ ok: true });
    }

    if (action === 'end') {
      const id = parseInt(req.body.id ?? req.query.id ?? 0, 10);
      let c = await q1('SELECT * FROM calls WHERE id=? AND (caller_id=? OR callee_id=?)', [id, me.id, me.id]);
      if (c) {
        if (c.status === 'answered' && c.answered_at) {
          const dur = Math.max(0, Math.floor((Date.now() - new Date(String(c.answered_at).replace(' ', 'T')).getTime()) / 1000));
          await run("UPDATE calls SET duration=?, status='ended', ended_at=NOW() WHERE id=?", [dur, id]);
          c.duration = dur; c.status = 'ended';
        } else {
          await run("UPDATE calls SET status='missed', ended_at=NOW() WHERE id=?", [id]);
          c.status = 'missed';
        }
        await logCallMessage(c);
      }
      return res.json({ ok: true });
    }

    if (action === 'incoming') {
      const c = await q1(
        `SELECT c.*, u.name, u.avatar, u.email FROM calls c JOIN users u ON u.id=c.caller_id
         WHERE c.callee_id=? AND c.status='no_answer' AND c.created_at > (NOW() - INTERVAL 45 SECOND)
         ORDER BY c.id DESC LIMIT 1`,
        [me.id]
      );
      if (c) return res.json({ ok: true, id: c.id, name: c.name || c.email, avatar: c.avatar, type: c.type });
      return res.json({ ok: false });
    }

    if (action === 'signal_set') {
      const id = parseInt(req.body.id || 0, 10);
      const role = req.body.role || '';
      const sdp = req.body.sdp ?? null;
      const ice = req.body.ice ?? null;
      if (role === 'caller') {
        if (sdp !== null) await run('UPDATE calls SET caller_sdp=? WHERE id=? AND caller_id=?', [sdp, id, me.id]);
        if (ice !== null) await run('UPDATE calls SET caller_ice=? WHERE id=? AND caller_id=?', [ice, id, me.id]);
      } else if (role === 'callee') {
        if (sdp !== null) await run('UPDATE calls SET callee_sdp=? WHERE id=? AND callee_id=?', [sdp, id, me.id]);
        if (ice !== null) await run('UPDATE calls SET callee_ice=? WHERE id=? AND callee_id=?', [ice, id, me.id]);
      }
      return res.json({ ok: true });
    }

    if (action === 'signal_get') {
      const id = parseInt(req.query.id || 0, 10);
      const c = await q1('SELECT caller_sdp,callee_sdp,caller_ice,callee_ice FROM calls WHERE id=? AND (caller_id=? OR callee_id=?)', [id, me.id, me.id]);
      if (!c) return res.json({ ok: false });
      return res.json({ ok: true, caller_sdp: c.caller_sdp, callee_sdp: c.callee_sdp, caller_ice: c.caller_ice, callee_ice: c.callee_ice });
    }

    return res.json({ ok: false });
  } catch (err) { next(err); }
});

// ---------------- Call UI ----------------
router.get('/call/:id', requireLogin(), async (req, res, next) => {
  try {
    const me = req.me;
    const id = parseInt(req.params.id, 10) || 0;
    const mode = req.query.mode || 'outgoing';
    const call = await q1('SELECT * FROM calls WHERE id=? AND (caller_id=? OR callee_id=?)', [id, me.id, me.id]);
    if (!call) return res.redirect('/chats');

    const otherId = (call.caller_id === me.id) ? call.callee_id : call.caller_id;
    const amCaller = (call.caller_id === me.id);
    const peer = await q1('SELECT id,name,email,avatar,last_seen FROM users WHERE id=?', [otherId]);
    const init = (peer.name || peer.email || '?').charAt(0).toUpperCase();
    const myInit = (me.name || me.email || '?').charAt(0).toUpperCase();
    const peerOnline = isOnline(peer.last_seen);
    const isVideo = call.type === 'video';

    res.render('call', { id, mode, call, otherId, amCaller, peer, init, myInit, peerOnline, isVideo });
  } catch (err) { next(err); }
});

module.exports = router;
