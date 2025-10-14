-- ============================================
-- Lorem Type Authentication Database Schema
-- ============================================
-- This file contains the complete database schema for the authentication system
-- Supports: PostgreSQL, MySQL (with minor modifications)
-- Created: October 14, 2025
-- ============================================

-- ============================================
-- TABLE: users
-- Stores all user accounts and authentication data
-- ============================================

CREATE TABLE users (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Public Profile (visible on leaderboard)
  username VARCHAR(30) UNIQUE NOT NULL,
  score INTEGER DEFAULT 0 CHECK (score >= 0),
  rank INTEGER,
  games_played INTEGER DEFAULT 0 CHECK (games_played >= 0),
  best_wpm DECIMAL(5,2),
  best_accuracy DECIMAL(5,2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Authentication (all hashed with bcrypt)
  abbreviation_hash VARCHAR(255) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  recovery_code_hash VARCHAR(255),  -- Nullable (user may skip recovery)
  
  -- Security & Rate Limiting
  failed_attempts INTEGER DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until TIMESTAMP,
  last_ip VARCHAR(45),  -- Supports IPv6
  
  -- Constraints
  CONSTRAINT chk_username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$')
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Speed up login lookups
CREATE INDEX idx_username ON users(username);

-- Speed up leaderboard queries
CREATE INDEX idx_score_desc ON users(score DESC);

-- Speed up rank calculations
CREATE INDEX idx_rank ON users(rank);

-- Speed up locked account checks
CREATE INDEX idx_locked_until ON users(locked_until) WHERE locked_until IS NOT NULL;

-- Compound index for active users with scores
CREATE INDEX idx_active_scores ON users(score DESC, created_at DESC) WHERE locked_until IS NULL;

-- ============================================
-- TABLE: rate_limits
-- Tracks login attempts for rate limiting
-- Alternative: Use Redis for better performance
-- ============================================

CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifier (username or IP address)
  identifier VARCHAR(100) NOT NULL,
  identifier_type VARCHAR(20) NOT NULL CHECK (identifier_type IN ('username', 'ip')),
  
  -- Rate limiting data
  attempts INTEGER DEFAULT 1 CHECK (attempts >= 0),
  window_start TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_identifier_window UNIQUE (identifier, identifier_type, window_start)
);

-- Index for fast rate limit lookups
CREATE INDEX idx_rate_limit_identifier ON rate_limits(identifier, identifier_type);
CREATE INDEX idx_rate_limit_window ON rate_limits(window_start);

-- ============================================
-- TABLE: game_history (Optional)
-- Store individual game sessions
-- ============================================

CREATE TABLE game_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Game Stats
  score INTEGER NOT NULL,
  wpm DECIMAL(5,2),
  accuracy DECIMAL(5,2),
  game_mode VARCHAR(20),  -- 'casual', 'normal', 'typist'
  word_type VARCHAR(20),  -- 'lorem', 'random', 'sentences'
  time_seconds INTEGER,
  
  -- Timestamp
  played_at TIMESTAMP DEFAULT NOW(),
  
  -- Index
  INDEX idx_user_games (user_id, played_at DESC)
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update rank based on score
CREATE OR REPLACE FUNCTION update_user_ranks()
RETURNS void AS $$
BEGIN
  WITH ranked_users AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as new_rank
    FROM users
    WHERE score > 0
  )
  UPDATE users
  SET rank = ranked_users.new_rank
  FROM ranked_users
  WHERE users.id = ranked_users.id;
  
  -- Set rank to NULL for users with 0 score
  UPDATE users
  SET rank = NULL
  WHERE score = 0;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTOMATIC CLEANUP JOBS
-- (Run these periodically with cron or scheduled tasks)
-- ============================================

-- Clean up expired rate limits (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Reset locked accounts after lock period expires
CREATE OR REPLACE FUNCTION unlock_expired_accounts()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    locked_until = NULL,
    failed_attempts = 0
  WHERE 
    locked_until IS NOT NULL 
    AND locked_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE QUERIES
-- ============================================

-- Get top 100 players for leaderboard
-- SELECT username, score, rank, games_played
-- FROM users
-- WHERE score > 0
-- ORDER BY score DESC, created_at ASC
-- LIMIT 100;

-- Check if account is locked
-- SELECT 
--   username,
--   locked_until,
--   CASE 
--     WHEN locked_until > NOW() THEN EXTRACT(EPOCH FROM (locked_until - NOW())) / 60
--     ELSE 0
--   END as minutes_remaining
-- FROM users
-- WHERE username = 'SpeedyTyper';

-- Get user's game history
-- SELECT 
--   score,
--   wpm,
--   accuracy,
--   game_mode,
--   played_at
-- FROM game_history
-- WHERE user_id = (SELECT id FROM users WHERE username = 'SpeedyTyper')
-- ORDER BY played_at DESC
-- LIMIT 20;

-- Check rate limit for username
-- SELECT 
--   identifier,
--   attempts,
--   window_start,
--   EXTRACT(EPOCH FROM (NOW() - window_start)) / 60 as minutes_elapsed
-- FROM rate_limits
-- WHERE identifier = 'SpeedyTyper'
--   AND identifier_type = 'username'
--   AND window_start > NOW() - INTERVAL '1 hour';

-- ============================================
-- INITIAL DATA (Optional)
-- ============================================

-- Insert sample user for testing (REMOVE IN PRODUCTION)
-- INSERT INTO users (username, abbreviation_hash, pin_hash, score, games_played)
-- VALUES (
--   'TestUser',
--   '$2b$12$dummy_hash_for_testing_only',
--   '$2b$12$dummy_hash_for_testing_only',
--   1000,
--   10
-- );

-- ============================================
-- BACKUP & MAINTENANCE QUERIES
-- ============================================

-- Backup users table
-- pg_dump -U postgres -t users lorem_type_db > users_backup.sql

-- Restore users table
-- psql -U postgres lorem_type_db < users_backup.sql

-- Check table sizes
-- SELECT 
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- MYSQL VERSION (Alternative)
-- ============================================

-- If using MySQL instead of PostgreSQL, use this version:

/*
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Public Profile
  username VARCHAR(30) UNIQUE NOT NULL,
  score INT DEFAULT 0 CHECK (score >= 0),
  rank INT,
  games_played INT DEFAULT 0 CHECK (games_played >= 0),
  best_wpm DECIMAL(5,2),
  best_accuracy DECIMAL(5,2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Authentication
  abbreviation_hash VARCHAR(255) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  recovery_code_hash VARCHAR(255),
  
  -- Security
  failed_attempts INT DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until TIMESTAMP NULL,
  last_ip VARCHAR(45),
  
  -- Indexes
  INDEX idx_username (username),
  INDEX idx_score_desc (score DESC),
  INDEX idx_rank (rank),
  INDEX idx_locked_until (locked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/

-- ============================================
-- SECURITY NOTES
-- ============================================

/*
IMPORTANT SECURITY CONSIDERATIONS:

1. NEVER store passwords in plain text
   - Always use bcrypt with salt rounds >= 12
   - Store only the hash, never the original value

2. Use parameterized queries to prevent SQL injection
   - NEVER concatenate user input into SQL strings
   - Use prepared statements or ORM

3. Database User Permissions:
   - Application user: SELECT, INSERT, UPDATE on users table
   - Application user: SELECT, INSERT, DELETE on rate_limits table
   - Admin user: Full permissions (for maintenance only)
   - Never use root/postgres user in application

4. Backups:
   - Daily automated backups
   - Test restore process monthly
   - Store backups encrypted
   - Keep 30 days of backups

5. Monitoring:
   - Set up alerts for unusual activity
   - Monitor failed login attempts
   - Track database performance
   - Log all authentication attempts

6. Connection Security:
   - Use SSL/TLS for database connections
   - Use connection pooling
   - Set connection timeout limits
   - Use firewall rules to restrict access
*/

-- ============================================
-- END OF SCHEMA
-- ============================================
