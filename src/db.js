// CK Chat (Node) - database layer. Same MySQL schema as the PHP version.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const ROOT = path.join(__dirname, '..');
const CONFIG_FILE = path.join(ROOT, 'config', 'config.json');
const LOCK_FILE = path.join(ROOT, 'config', 'installed.lock');
const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

let pool = null;
let settingsCache = null;

function isInstalled() {
  return fs.existsSync(CONFIG_FILE) && fs.existsSync(LOCK_FILE);
}

function readConfig() {
  if (process.env.DB_HOST && process.env.DB_NAME) {
    return {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      dbname: process.env.DB_NAME,
      user: process.env.DB_USER,
      pass: process.env.DB_PASS || '',
    };
  }
  if (!fs.existsSync(CONFIG_FILE)) return null;
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

function writeConfig(cfg) {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

function writeLock() {
  fs.mkdirSync(path.dirname(LOCK_FILE), { recursive: true });
  fs.writeFileSync(LOCK_FILE, new Date().toISOString());
}

function getPool() {
  if (pool) return pool;
  const cfg = readConfig();
  if (!cfg) throw new Error('Not installed');
  pool = mysql.createPool({
    host: cfg.host,
    port: cfg.port || 3306,
    user: cfg.user,
    password: cfg.pass,
    database: cfg.dbname,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 20,
    timezone: '+05:00', // Pakistan time, same as PHP version
    dateStrings: true,
  });
  return pool;
}

// query -> rows array
async function q(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}
// query first row or null
async function q1(sql, params = []) {
  const rows = await q(sql, params);
  return rows.length ? rows[0] : null;
}
// insert/update -> result (insertId, affectedRows)
async function run(sql, params = []) {
  const [res] = await getPool().execute(sql, params);
  return res;
}
// raw multi statement (schema install)
async function raw(sql, cfg) {
  const conn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port || 3306,
    user: cfg.user,
    password: cfg.pass,
    database: cfg.dbname,
    multipleStatements: true,
  });
  await conn.query("SET time_zone = '+05:00'");
  await conn.query(sql);
  await conn.end();
}

function schemaSql() {
  return fs.readFileSync(SCHEMA_FILE, 'utf8');
}

// ---- optional schema (mirrors ensure_optional_schema in PHP) ----
async function ensureOptionalSchema() {
  const alters = [
    "ALTER TABLE users ADD username VARCHAR(60) UNIQUE NULL AFTER email",
    "ALTER TABLE users ADD password VARCHAR(255) NULL AFTER email",
    "ALTER TABLE users ADD dark_mode TINYINT(1) DEFAULT 0 AFTER theme",
    "ALTER TABLE users ADD blue_tick TINYINT(1) DEFAULT 0",
    "ALTER TABLE users ADD blue_tick_expires DATETIME NULL",
    "ALTER TABLE users ADD remember_token VARCHAR(64) NULL",
    "ALTER TABLE users ADD is_private TINYINT(1) DEFAULT 0",
    "ALTER TABLE users ADD calls_seen_at DATETIME NULL",
    "ALTER TABLE channels ADD blue_tick TINYINT(1) DEFAULT 0",
    "ALTER TABLE channels ADD bonus_followers INT DEFAULT 0",
    "ALTER TABLE channels ADD invite_token VARCHAR(40) NULL AFTER owner_id",
    "ALTER TABLE messages ADD delivered TINYINT(1) DEFAULT 0 AFTER seen",
    "ALTER TABLE support_tickets ADD reply TEXT NULL AFTER description",
    "ALTER TABLE support_tickets ADD replied_at DATETIME NULL AFTER reply",
    "ALTER TABLE status_posts ADD video VARCHAR(255) NULL AFTER image",
    "ALTER TABLE ads ADD video VARCHAR(255) NULL AFTER image",
    "ALTER TABLE ads ADD title VARCHAR(255) NULL AFTER caption",
    "ALTER TABLE calls ADD answered_at DATETIME NULL",
    "CREATE TABLE IF NOT EXISTS channel_reads (channel_id INT NOT NULL, user_id INT NOT NULL, last_msg_id INT DEFAULT 0, PRIMARY KEY(channel_id,user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS group_reads (group_id INT NOT NULL, user_id INT NOT NULL, last_msg_id INT DEFAULT 0, PRIMARY KEY(group_id,user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS group_left_log (id INT AUTO_INCREMENT PRIMARY KEY, group_id INT, user_id INT, left_at DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  ];
  for (const sql of alters) {
    try { await getPool().query(sql); } catch (e) { /* column/table already exists */ }
  }
  const defaults = {
    support_link: '/support',
    verify_price: '500 PKR',
    app_name: 'CK Chat',
    broadcast_name: 'CK Chat',
    smtp_host: 'smtp.hostinger.com',
    smtp_port: '465',
    smtp_secure: 'ssl',
    smtp_user: 'support@777sc.site',
    smtp_from: 'support@777sc.site',
    smtp_from_name: 'CK Chat',
  };
  for (const [k, v] of Object.entries(defaults)) {
    try { await run('INSERT IGNORE INTO settings (k,v) VALUES (?,?)', [k, v]); } catch (e) {}
  }
  settingsCache = null;
}

async function loadSettings() {
  if (settingsCache) return settingsCache;
  const rows = await q('SELECT k,v FROM settings');
  settingsCache = {};
  rows.forEach((r) => { settingsCache[r.k] = r.v; });
  return settingsCache;
}

function setting(k, def = '') {
  if (!settingsCache) return def;
  const v = settingsCache[k];
  return v === undefined || v === null ? def : v;
}

async function setSetting(k, v) {
  await run('INSERT INTO settings (k,v) VALUES (?,?) ON DUPLICATE KEY UPDATE v=VALUES(v)', [k, v]);
  if (settingsCache) settingsCache[k] = v;
}

function clearSettingsCache() { settingsCache = null; }

module.exports = {
  CONFIG_FILE, LOCK_FILE,
  isInstalled, readConfig, writeConfig, writeLock,
  getPool, q, q1, run, raw, schemaSql,
  ensureOptionalSchema, loadSettings, setting, setSetting, clearSettingsCache,
};
