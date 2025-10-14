/**
 * Score Controller
 * Handles score updates and leaderboard operations
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

/**
 * Middleware: Authenticate JWT token
 * Verifies the JWT token from Authorization header
 */
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token required'
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

/**
 * POST /api/scores/update
 * Update user score (requires authentication)
 * 
 * Headers:
 * Authorization: Bearer <jwt_token>
 * 
 * Request Body:
 * {
 *   score: number,
 *   gameData: {
 *     wpm: number,
 *     accuracy: number,
 *     time: number,
 *     gameMode: string,
 *     wordType: string
 *   }
 * }
 */
exports.updateScore = async (req, res) => {
  try {
    const { score, gameData } = req.body;
    const userId = req.user.userId;

    // === INPUT VALIDATION ===
    
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid score is required'
      });
    }

    // === FETCH CURRENT USER DATA ===
    
    const result = await db.query(
      `SELECT 
        username, 
        score as current_score, 
        rank as current_rank,
        games_played,
        best_wpm,
        best_accuracy
      FROM users 
      WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    // === UPDATE USER STATS ===
    
    // Only update score if new score is higher
    const newScore = Math.max(score, user.current_score);
    const newGamesPlayed = user.games_played + 1;
    
    // Track best WPM and accuracy
    let newBestWPM = user.best_wpm;
    let newBestAccuracy = user.best_accuracy;
    
    if (gameData?.wpm && (!newBestWPM || gameData.wpm > newBestWPM)) {
      newBestWPM = gameData.wpm;
    }
    
    if (gameData?.accuracy && (!newBestAccuracy || gameData.accuracy > newBestAccuracy)) {
      newBestAccuracy = gameData.accuracy;
    }

    await db.query(
      `UPDATE users 
      SET 
        score = $1,
        games_played = $2,
        best_wpm = $3,
        best_accuracy = $4
      WHERE id = $5`,
      [newScore, newGamesPlayed, newBestWPM, newBestAccuracy, userId]
    );

    // === SAVE GAME HISTORY (Optional) ===
    
    if (gameData) {
      await db.query(
        `INSERT INTO game_history (
          user_id,
          score,
          wpm,
          accuracy,
          game_mode,
          word_type,
          time_seconds
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          score,
          gameData.wpm || null,
          gameData.accuracy || null,
          gameData.gameMode || null,
          gameData.wordType || null,
          gameData.time || null
        ]
      );
    }

    // === UPDATE RANKS ===
    
    // Recalculate ranks for all users
    await db.query('SELECT update_user_ranks()');

    // === FETCH NEW RANK ===
    
    const updatedResult = await db.query(
      'SELECT rank FROM users WHERE id = $1',
      [userId]
    );

    const newRank = updatedResult.rows[0].rank;

    // === RETURN SUCCESS RESPONSE ===
    
    return res.status(200).json({
      success: true,
      message: 'Score updated successfully',
      data: {
        username: user.username,
        newScore: newScore,
        previousScore: user.current_score,
        newRank: newRank,
        previousRank: user.current_rank,
        gamesPlayed: newGamesPlayed,
        bestWPM: newBestWPM,
        bestAccuracy: newBestAccuracy,
        scoreImproved: newScore > user.current_score,
        rankImproved: newRank < user.current_rank
      }
    });

  } catch (error) {
    console.error('Score update error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while updating score'
    });
  }
};

/**
 * GET /api/leaderboard
 * Get top scores (public endpoint, no authentication required)
 * 
 * Query Parameters:
 * - limit: number (default: 100, max: 500)
 * - offset: number (default: 0)
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;

    // === FETCH LEADERBOARD ===
    
    const result = await db.query(
      `SELECT 
        rank,
        username,
        score,
        games_played,
        best_wpm,
        best_accuracy,
        created_at
      FROM users
      WHERE score > 0
      ORDER BY score DESC, created_at ASC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // === GET TOTAL COUNT ===
    
    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM users WHERE score > 0'
    );

    const total = parseInt(countResult.rows[0].total);

    // === RETURN LEADERBOARD ===
    
    return res.status(200).json({
      success: true,
      data: {
        leaderboard: result.rows,
        total: total,
        limit: limit,
        offset: offset,
        hasMore: (offset + limit) < total
      }
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while fetching leaderboard'
    });
  }
};

/**
 * GET /api/users/:username
 * Get user profile and stats (public endpoint)
 * 
 * URL Parameters:
 * - username: string
 */
exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;

    // === FETCH USER DATA ===
    
    const result = await db.query(
      `SELECT 
        username,
        score,
        rank,
        games_played,
        best_wpm,
        best_accuracy,
        created_at
      FROM users
      WHERE username = $1`,
      [username.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    // === FETCH RECENT GAMES (Optional) ===
    
    const gamesResult = await db.query(
      `SELECT 
        score,
        wpm,
        accuracy,
        game_mode,
        word_type,
        time_seconds,
        played_at
      FROM game_history
      WHERE user_id = (SELECT id FROM users WHERE username = $1)
      ORDER BY played_at DESC
      LIMIT 10`,
      [username.toLowerCase()]
    );

    // === RETURN USER PROFILE ===
    
    return res.status(200).json({
      success: true,
      data: {
        user: user,
        recentGames: gamesResult.rows
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while fetching user profile'
    });
  }
};

/**
 * GET /api/users/:username/history
 * Get user's game history (requires authentication if viewing own history)
 * 
 * URL Parameters:
 * - username: string
 * 
 * Query Parameters:
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 */
exports.getUserHistory = async (req, res) => {
  try {
    const { username } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    // === FETCH GAME HISTORY ===
    
    const result = await db.query(
      `SELECT 
        score,
        wpm,
        accuracy,
        game_mode,
        word_type,
        time_seconds,
        played_at
      FROM game_history
      WHERE user_id = (SELECT id FROM users WHERE username = $1)
      ORDER BY played_at DESC
      LIMIT $2 OFFSET $3`,
      [username.toLowerCase(), limit, offset]
    );

    // === GET TOTAL COUNT ===
    
    const countResult = await db.query(
      `SELECT COUNT(*) as total 
      FROM game_history
      WHERE user_id = (SELECT id FROM users WHERE username = $1)`,
      [username.toLowerCase()]
    );

    const total = parseInt(countResult.rows[0].total);

    // === RETURN GAME HISTORY ===
    
    return res.status(200).json({
      success: true,
      data: {
        history: result.rows,
        total: total,
        limit: limit,
        offset: offset,
        hasMore: (offset + limit) < total
      }
    });

  } catch (error) {
    console.error('Get user history error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while fetching game history'
    });
  }
};

module.exports = exports;
