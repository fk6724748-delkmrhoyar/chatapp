// CK Chat - Node.js (Express + MySQL + Socket.IO)
// Same UI, same features as the CK Chat PHP script, just faster.
const path = require('path');
const http = require('http');
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const db = require('./db');
const helpers = require('./helpers');
const { tryRememberLogin } = require('./auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.set('io', io);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(session({
  store: new FileStore({ path: path.join(__dirname, '..', 'config', 'sessions'), retries: 0, logFn: () => {} }),
  secret: process.env.SESSION_SECRET || 'ck-chat-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' },
}));

app.use('/assets', express.static(path.join(__dirname, '..', 'public', 'assets'), { maxAge: '7d' }));
app.use('/uploads', express.static(helpers.UPLOAD_DIR, { maxAge: '30d' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// expose helpers to every view
app.use((req, res, next) => {
  Object.assign(res.locals, helpers);
  res.locals.setting = db.setting;
  res.locals.tab = '';
  res.locals.me = null;
  res.locals.query = req.query;
  next();
});

// installer gate + settings + remember-me
app.use(async (req, res, next) => {
  try {
    if (!db.isInstalled()) {
      if (req.path.startsWith('/install') || req.path.startsWith('/assets')) return next();
      return res.redirect('/install');
    }
    await db.loadSettings();
    res.locals.app_name = db.setting('app_name', 'CK Chat');
    res.locals.app_logo = db.setting('app_logo', '');
    await tryRememberLogin(req);
    next();
  } catch (err) { next(err); }
});

app.use('/install', require('./routes/install'));
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/chats'));
app.use('/', require('./routes/groups'));
app.use('/', require('./routes/channels'));
app.use('/', require('./routes/status'));
app.use('/', require('./routes/calls'));
app.use('/', require('./routes/settings'));
app.use('/ckmr', require('./routes/admin'));

app.use((req, res) => {
  res.status(404).send('Not found');
});
app.use((err, req, res, next) => { // eslint-disable-line
  console.error(err);
  res.status(500).send('Server error: ' + (err && err.message));
});

// ---- realtime: instant messaging + WebRTC call signalling ----
require('./realtime')(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('CK Chat running on http://localhost:' + PORT);
});
