// CK Chat (Node) - view + app helpers (mirrors includes/db.php helper functions)
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname || '') || '').toLowerCase().slice(0, 10) || '.bin';
    cb(null, Date.now() + '_' + crypto.randomBytes(6).toString('hex') + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 64 * 1024 * 1024 } });

// returns public url of an uploaded file field, or '' if none
function uploadedUrl(req, field) {
  const files = req.files;
  if (!files) return '';
  const list = Array.isArray(files) ? files : files[field];
  if (!list || !list.length) return '';
  return '/uploads/' + list[0].filename;
}

function e(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function usernameSlug(s) {
  return String(s || '').trim().replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase();
}

function displayName(u) {
  if (!u) return '';
  return u.name || (u.username ? '@' + u.username : u.email);
}

function blueTickHtml() {
  return '<svg class="blue-tick" viewBox="0 0 24 24" width="14" height="14" fill="#1e6bff" style="vertical-align:-2px"><path d="M12 2 14.2 4.6l3.4-.6.6 3.4L21 9.6 19.4 12 21 14.4l-2.8 2.2-.6 3.4-3.4-.6L12 22l-2.2-2.6-3.4.6-.6-3.4L3 14.4 4.6 12 3 9.6l2.8-2.2.6-3.4 3.4.6L12 2Zm-1.2 13.4 5.2-5.2-1.4-1.4-3.8 3.8-1.8-1.8-1.4 1.4 3.2 3.2Z"/></svg>';
}

function initial(u) {
  const base = (u && (u.name || u.email)) || '?';
  return String(base).charAt(0).toUpperCase();
}

// PHP date('g:i A')
function timeAmPm(dt) {
  const d = toDate(dt);
  if (!d) return '';
  let h = d.getHours();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + ap;
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// PHP date('M j, Y')
function dayLabel(dt) {
  const d = toDate(dt);
  if (!d) return '';
  return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}
// PHP date('Y-m-d')
function dayKey(dt) {
  const d = toDate(dt);
  if (!d) return '';
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function toDate(dt) {
  if (!dt) return null;
  if (dt instanceof Date) return dt;
  const s = String(dt).replace(' ', 'T');
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function isOnline(lastSeen) {
  const d = toDate(lastSeen);
  return !!d && d.getTime() > Date.now() - 120000;
}

function nl2brLinkify(body) {
  return e(body)
    .replace(/(https?:\/\/\S+)/gi, '<a class="link" href="$1" target="_blank">$1</a>')
    .replace(/\n/g, '<br>');
}

function attachmentKind(att) {
  if (!att) return '';
  const ext = String(att).split('.').pop().toLowerCase();
  if (['webm', 'ogg', 'oga', 'mp3', 'm4a', 'wav', 'aac'].includes(ext) && !['mp4', 'mov'].includes(ext)) {
    // .webm can be audio (voice notes) - PHP treated webm as audio first
    return 'audio';
  }
  if (['mp4', 'mov', 'm4v', '3gp'].includes(ext)) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
  return 'file';
}

function formatCount(n) {
  n = parseInt(n, 10) || 0;
  if (n < 1000) return String(n);
  const fmt = (v) => {
    const r = v < 10 ? String(Math.round(v * 10) / 10).replace(/\.0$/, '') : String(Math.floor(v));
    return r;
  };
  if (n < 1000000) return fmt(n / 1000) + 'k';
  return fmt(n / 1000000) + 'm';
}

module.exports = {
  upload, uploadedUrl, UPLOAD_DIR,
  e, usernameSlug, displayName, blueTickHtml, initial,
  timeAmPm, dayLabel, dayKey, toDate, isOnline, nl2brLinkify, attachmentKind, formatCount,
};
