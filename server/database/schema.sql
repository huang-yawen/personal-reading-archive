-- Personal Reading and Archive
-- MySQL 8.0+
-- Import this file into MySQL Workbench or run: mysql -u <user> -p < schema.sql

CREATE DATABASE IF NOT EXISTS personal_archive
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE personal_archive;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS media_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  media_type ENUM('book', 'movie') NOT NULL,
  title VARCHAR(255) NOT NULL,
  creator VARCHAR(255) NULL COMMENT 'Author for books; director for movies',
  description TEXT NULL,
  cover_url VARCHAR(2048) NULL,
  status ENUM('planned', 'in_progress', 'completed', 'paused', 'dropped') NOT NULL DEFAULT 'planned',
  rating DECIMAL(3,1) NULL COMMENT '0.0-10.0',
  review TEXT NULL,
  started_on DATE NULL,
  completed_on DATE NULL,
  page_count SMALLINT UNSIGNED NULL COMMENT 'Books only',
  runtime_minutes SMALLINT UNSIGNED NULL COMMENT 'Movies only',
  release_year YEAR NULL COMMENT 'Movies only',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_media_items_user_status (user_id, status),
  KEY ix_media_items_user_type (user_id, media_type),
  KEY ix_media_items_user_completed (user_id, completed_on),
  KEY ix_media_items_user_title (user_id, title),
  CONSTRAINT fk_media_items_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_media_items_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  CONSTRAINT chk_media_items_dates CHECK (completed_on IS NULL OR started_on IS NULL OR completed_on >= started_on),
  CONSTRAINT chk_media_items_book_fields CHECK (media_type <> 'book' OR runtime_minutes IS NULL),
  CONSTRAINT chk_media_items_movie_fields CHECK (media_type <> 'movie' OR page_count IS NULL)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tags (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(50) NOT NULL,
  color CHAR(7) NOT NULL DEFAULT '#64748b',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_tags_user_name (user_id, name),
  CONSTRAINT fk_tags_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS media_item_tags (
  media_item_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (media_item_id, tag_id),
  KEY ix_media_item_tags_tag (tag_id),
  CONSTRAINT fk_media_item_tags_item FOREIGN KEY (media_item_id) REFERENCES media_items (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_media_item_tags_tag FOREIGN KEY (tag_id) REFERENCES tags (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  media_item_id BIGINT UNSIGNED NOT NULL,
  activity_date DATE NOT NULL,
  progress_value SMALLINT UNSIGNED NULL COMMENT 'Page reached for books, minutes watched for movies',
  note VARCHAR(1000) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_activity_logs_item_date (media_item_id, activity_date),
  CONSTRAINT fk_activity_logs_item FOREIGN KEY (media_item_id) REFERENCES media_items (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Optional starter account for local development. Remove or change before sharing the database.
INSERT INTO users (email, display_name)
VALUES ('demo@example.com', 'Demo User')
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- Development seed data. These statements can be run more than once.
SET @demo_user_id = (
  SELECT id FROM users WHERE email = 'demo@example.com' LIMIT 1
);

INSERT INTO tags (user_id, name, color)
VALUES
  (@demo_user_id, '科幻', '#6366f1'),
  (@demo_user_id, '成长', '#22c55e'),
  (@demo_user_id, '悬疑', '#f97316'),
  (@demo_user_id, '收藏', '#ec4899')
ON DUPLICATE KEY UPDATE color = VALUES(color);

INSERT INTO media_items (
  user_id, media_type, title, creator, description, status, rating,
  review, started_on, completed_on, page_count, runtime_minutes, release_year
)
SELECT
  @demo_user_id, 'book', '三体', '刘慈欣',
  '一部从文明尺度讨论人类命运的科幻小说。', 'completed', 9.0,
  '设定宏大，读完后仍想继续讨论。', '2026-09-03', '2026-09-16', 302, NULL, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM media_items
  WHERE user_id = @demo_user_id AND media_type = 'book' AND title = '三体'
);

INSERT INTO media_items (
  user_id, media_type, title, creator, description, status, rating,
  review, started_on, completed_on, page_count, runtime_minutes, release_year
)
SELECT
  @demo_user_id, 'book', '置身事内', '兰小欢',
  '从地方政府投融资角度理解中国经济运行。', 'in_progress', NULL,
  NULL, '2026-10-20', NULL, 608, NULL, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM media_items
  WHERE user_id = @demo_user_id AND media_type = 'book' AND title = '置身事内'
);

INSERT INTO media_items (
  user_id, media_type, title, creator, description, status, rating,
  review, started_on, completed_on, page_count, runtime_minutes, release_year
)
SELECT
  @demo_user_id, 'movie', '星际穿越', 'Christopher Nolan',
  '一场穿越宇宙与时间的探索。', 'completed', 9.5,
  '配乐和画面都很有冲击力。', '2026-09-28', '2026-09-28', NULL, 169, 2014
WHERE NOT EXISTS (
  SELECT 1 FROM media_items
  WHERE user_id = @demo_user_id AND media_type = 'movie' AND title = '星际穿越'
);

INSERT INTO media_items (
  user_id, media_type, title, creator, description, status, rating,
  review, started_on, completed_on, page_count, runtime_minutes, release_year
)
SELECT
  @demo_user_id, 'movie', '看不见的客人', 'Oriol Paulo',
  '一部围绕不在场证明展开的悬疑电影。', 'planned', NULL,
  NULL, NULL, NULL, NULL, 106, 2016
WHERE NOT EXISTS (
  SELECT 1 FROM media_items
  WHERE user_id = @demo_user_id AND media_type = 'movie' AND title = '看不见的客人'
);

-- Link seed entries with their tags.
INSERT IGNORE INTO media_item_tags (media_item_id, tag_id)
SELECT m.id, t.id
FROM media_items m
JOIN tags t ON t.user_id = m.user_id
WHERE m.user_id = @demo_user_id
  AND ((m.title = '三体' AND t.name IN ('科幻', '收藏'))
    OR (m.title = '置身事内' AND t.name = '成长')
    OR (m.title = '星际穿越' AND t.name IN ('科幻', '收藏'))
    OR (m.title = '看不见的客人' AND t.name = '悬疑'));

-- Reading and viewing progress.
INSERT INTO activity_logs (media_item_id, activity_date, progress_value, note)
SELECT m.id, '2026-10-20', 80, '读完第一章，开始理解地方政府融资平台的逻辑。'
FROM media_items m
WHERE m.user_id = @demo_user_id AND m.title = '置身事内'
  AND NOT EXISTS (
    SELECT 1 FROM activity_logs a
    WHERE a.media_item_id = m.id AND a.activity_date = '2026-10-20'
  );

INSERT INTO activity_logs (media_item_id, activity_date, progress_value, note)
SELECT m.id, '2026-10-24', 156, '继续阅读，整理了几个需要查资料的概念。'
FROM media_items m
WHERE m.user_id = @demo_user_id AND m.title = '置身事内'
  AND NOT EXISTS (
    SELECT 1 FROM activity_logs a
    WHERE a.media_item_id = m.id AND a.activity_date = '2026-10-24'
  );
