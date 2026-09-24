# CK Chat — Node.js (Express + MySQL + Socket.IO)

Same design, same features as the PHP version — but faster (real-time via Socket.IO instead of AJAX polling).

## Requirements
- Node.js 18+
- MySQL 5.7+ / MariaDB

## Install (local or VPS)

```bash
cd ckchat-node
npm install
npm start          # http://localhost:3000
```

Open `http://localhost:3000/install` and fill in the database details + admin account.
The installer creates all tables and writes `config/config.json` + `config/installed.lock`.

## Environment variables (optional — overrides config.json)

```
PORT=3000
SESSION_SECRET=change-me
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ckchat
DB_USER=root
DB_PASS=secret
```

## Run with PM2 (hosting)

```bash
npm i -g pm2
pm2 start src/server.js --name ckchat
pm2 save && pm2 startup
```

Put Nginx in front and proxy `/` to `http://127.0.0.1:3000` with WebSocket upgrade headers:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Notes
- Admin panel: `/ckmr`
- Uploads are stored in `uploads/` and served at `/uploads`.
- SMTP / OTP settings are editable in the admin panel settings page.
- HTTPS is required for camera, microphone and WebRTC calls in production.
