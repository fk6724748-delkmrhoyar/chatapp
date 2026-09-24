// CK Chat (Node) - installer, same flow as install.php
const express = require('express');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  if (db.isInstalled() && !('force' in req.query)) {
    return res.send('Already installed. Delete config/installed.lock to reinstall.');
  }
  res.render('install', { ok: false, error: '' });
});

router.post('/', async (req, res) => {
  const b = req.body;
  const cfg = {
    host: (b.host || 'localhost').trim(),
    port: Number(b.port || 3306),
    dbname: (b.dbname || '').trim(),
    user: (b.user || '').trim(),
    pass: b.pass || '',
  };
  try {
    const conn = await mysql.createConnection({
      host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.pass, multipleStatements: true,
    });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${cfg.dbname}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.end();

    await db.raw(db.schemaSql(), cfg);

    db.writeConfig(cfg);
    const hash = bcrypt.hashSync(b.admin_pass || '', 10);
    await db.run('INSERT INTO admins (username,email,password) VALUES (?,?,?)', [
      (b.admin_user || 'admin').trim(), (b.admin_email || '').trim(), hash,
    ]);

    const defaults = [
      ['app_name', 'CK Chat'], ['app_logo', ''], ['broadcast_name', 'CK Chat'], ['broadcast_logo', ''],
      ['theme', 'blue'], ['support_link', '/support'], ['verify_price', '500 PKR'],
      ['easypaisa', '03000000000 | CK | EP001'], ['jazzcash', '03000000000 | CK | JC001'],
      ['binance', '0000000 | CK | BN001'],
      ['smtp_host', 'smtp.hostinger.com'], ['smtp_port', '465'], ['smtp_secure', 'ssl'],
      ['smtp_user', 'support@777sc.site'], ['smtp_from', 'support@777sc.site'], ['smtp_from_name', 'CK Chat'],
    ];
    for (const [k, v] of defaults) {
      await db.run('INSERT IGNORE INTO settings (k,v) VALUES (?,?)', [k, v]);
    }
    await db.ensureOptionalSchema();
    db.writeLock();
    res.render('install', { ok: true, error: '' });
  } catch (err) {
    res.render('install', { ok: false, error: err.message });
  }
});

module.exports = router;
