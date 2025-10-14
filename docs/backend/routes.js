/**
 * Express Routes Configuration
 * Defines all API endpoints for the Lorem Type application
 */

const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('./auth.controller');
const scoreController = require('./score.controller');

// ============================================
// AUTHENTICATION ROUTES
// ============================================

/**
 * POST /api/auth/register
 * Register a new user account
 * Public endpoint
 */
router.post('/auth/register', authController.register);

/**
 * POST /api/auth/login
 * Authenticate user and get JWT token
 * Public endpoint
 */
router.post('/auth/login', authController.login);

/**
 * POST /api/auth/recover
 * Verify recovery code and get reset token
 * Public endpoint
 */
router.post('/auth/recover', authController.recover);

/**
 * POST /api/auth/reset
 * Reset user credentials after recovery
 * Requires reset token
 */
router.post('/auth/reset', authController.reset);

/**
 * POST /api/auth/send-recovery-email
 * Send recovery code to email (email NOT stored)
 * Public endpoint
 */
router.post('/auth/send-recovery-email', authController.sendRecoveryEmailEndpoint);

// ============================================
// SCORE ROUTES
// ============================================

/**
 * POST /api/scores/update
 * Update user score
 * Requires authentication (JWT token)
 */
router.post(
  '/scores/update',
  scoreController.authenticateToken,
  scoreController.updateScore
);

// ============================================
// LEADERBOARD & USER ROUTES (Public)
// ============================================

/**
 * GET /api/leaderboard
 * Get top scores
 * Public endpoint
 */
router.get('/leaderboard', scoreController.getLeaderboard);

/**
 * GET /api/users/:username
 * Get user profile and stats
 * Public endpoint
 */
router.get('/users/:username', scoreController.getUserProfile);

/**
 * GET /api/users/:username/history
 * Get user's game history
 * Public endpoint (or authenticated if viewing own history)
 */
router.get('/users/:username/history', scoreController.getUserHistory);

// ============================================
// HEALTH CHECK ROUTE
// ============================================

/**
 * GET /api/health
 * Health check endpoint
 * Returns API status
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lorem Type API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
