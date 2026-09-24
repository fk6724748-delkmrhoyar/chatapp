// CK Chat (Node) - OTP mailer (mirrors includes/mailer.php, SMTP settings from admin panel)
const nodemailer = require('nodemailer');
const { setting } = require('./db');

let lastError = '';

function transport() {
  const port = parseInt(setting('smtp_port', '465'), 10) || 465;
  const secure = String(setting('smtp_secure', 'ssl')).toLowerCase() === 'ssl' || port === 465;
  return nodemailer.createTransport({
    host: setting('smtp_host', 'smtp.hostinger.com'),
    port,
    secure,
    auth: {
      user: setting('smtp_user', ''),
      pass: setting('smtp_pass', ''),
    },
  });
}

async function sendOtpEmail(to, code, appName) {
  lastError = '';
  try {
    if (!setting('smtp_user') || !setting('smtp_pass')) {
      lastError = 'SMTP mailbox password is not set in the admin panel.';
      return false;
    }
    await transport().sendMail({
      from: `"${setting('smtp_from_name', appName)}" <${setting('smtp_from', setting('smtp_user'))}>`,
      to,
      subject: `${appName} verification code`,
      text: `Your ${appName} verification code is ${code}. It expires in 10 minutes.`,
      html: `<div style="font-family:system-ui;padding:20px">
        <h2 style="color:#1e6bff;margin:0 0 10px">${appName}</h2>
        <p>Your verification code is:</p>
        <div style="font-size:30px;font-weight:800;letter-spacing:8px;color:#0b1733">${code}</div>
        <p style="color:#6b7a99;font-size:13px">This code expires in 10 minutes.</p>
      </div>`,
    });
    return true;
  } catch (err) {
    lastError = err && err.message ? err.message : String(err);
    return false;
  }
}

async function sendTestEmail(to, appName) {
  lastError = '';
  try {
    await transport().sendMail({
      from: `"${setting('smtp_from_name', appName)}" <${setting('smtp_from', setting('smtp_user'))}>`,
      to,
      subject: `${appName} SMTP test`,
      text: 'SMTP is working.',
    });
    return true;
  } catch (err) {
    lastError = err && err.message ? err.message : String(err);
    return false;
  }
}

function otpMailerLastError() { return lastError; }

module.exports = { sendOtpEmail, sendTestEmail, otpMailerLastError };
