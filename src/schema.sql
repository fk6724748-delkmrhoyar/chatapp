CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) UNIQUE NOT NULL,
  password VARCHAR(255) NULL,
  username VARCHAR(60) UNIQUE,
  name VARCHAR(100),
  phone VARCHAR(40),
  about TEXT,
  avatar VARCHAR(255),
  wallpaper VARCHAR(255),
  theme VARCHAR(20) DEFAULT 'blue',
  dark_mode TINYINT(1) DEFAULT 0,
  blue_tick TINYINT(1) DEFAULT 0,
  blue_tick_expires DATETIME NULL,
  banned TINYINT(1) DEFAULT 0,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  username_changed_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  email VARCHAR(190) UNIQUE,
  password VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
  k VARCHAR(100) PRIMARY KEY,
  v TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NULL,
  group_id INT NULL,
  channel_id INT NULL,
  body TEXT,
  attachment VARCHAR(255),
  attachment_type VARCHAR(30),
  is_broadcast TINYINT(1) DEFAULT 0,
  seen TINYINT(1) DEFAULT 0,
  delivered TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX(sender_id), INDEX(receiver_id), INDEX(group_id), INDEX(channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS groups_tbl (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150),
  description TEXT,
  avatar VARCHAR(255),
  owner_id INT,
  only_admin_msg TINYINT(1) DEFAULT 0,
  add_anyone TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS group_members (
  group_id INT, user_id INT, is_admin TINYINT(1) DEFAULT 0,
  PRIMARY KEY(group_id,user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS channels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150),
  description TEXT,
  avatar VARCHAR(255),
  owner_id INT,
  invite_token VARCHAR(40) NULL,
  blue_tick TINYINT(1) DEFAULT 0,
  banned TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS channel_followers (
  channel_id INT, user_id INT,
  PRIMARY KEY(channel_id,user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS status_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  body TEXT, image VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS status_views (
  status_id INT, user_id INT, PRIMARY KEY(status_id,user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS calls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  caller_id INT, callee_id INT,
  type ENUM('voice','video') DEFAULT 'voice',
  status ENUM('missed','answered','no_answer') DEFAULT 'no_answer',
  duration INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS blocks (
  user_id INT, blocked_id INT, PRIMARY KEY(user_id,blocked_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT, target_id INT, target_type VARCHAR(20),
  reason TEXT, status VARCHAR(20) DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT, email VARCHAR(190), title VARCHAR(200), description TEXT,
  reply TEXT,
  replied_at DATETIME NULL,
  status VARCHAR(20) DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS verify_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT, target_type ENUM('user','channel'),
  target_name VARCHAR(150), email VARCHAR(190),
  method VARCHAR(30), trx_id VARCHAR(100),
  screenshot VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image VARCHAR(255), caption TEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS group_left_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT, user_id INT,
  left_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
