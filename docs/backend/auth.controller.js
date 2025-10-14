/**
 * Authentication Controller
 * Handles user registration, login, recovery, and password resets
 * 
 * Security Features:
 * - bcrypt password hashing (salt rounds = 12)
 * - Rate limiting (3 attempts per user per hour)
 * - Account lockout (1 hour after 3 failures)
 * - JWT token generation
 * - Input validation and sanitization
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Import utility functions (see utils/ folder)
const { 
  validateUsername, 
  validateAbbreviation, 
  validatePIN,
  generateRecoveryCode,
  sendRecoveryEmail
} = require('../utils/validation');

const { 
  checkRateLimit, 
  recordAttempt, 
  resetAttempts 
} = require('../utils/rateLimit');

// Environment variables (set these in .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
const BCRYPT_ROUNDS = 12;

/**
 * POST /api/auth/register
 * Register a new user account
 * 
 * Request Body:
 * {
 *   username: string (3-30 chars),
 *   abbreviation: string (4-5 chars),
 *   pin: string (5-7 digits),
 *   generateRecoveryCode: boolean (optional),
 *   email: string (optional, for recovery code delivery)
 * }
 */
exports.register = async (req, res) => {
  try {
    const { username, abbreviation, pin, generateRecoveryCode, email } = req.body;

    // === INPUT VALIDATION ===
    
    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({
        success: false,
        error: usernameValidation.error
      });
    }

    // Validate abbreviation
    const abbreviationValidation = validateAbbreviation(abbreviation, username);
    if (!abbreviationValidation.valid) {
      return res.status(400).json({
        success: false,
        error: abbreviationValidation.error
      });
    }

    // Validate PIN
    const pinValidation = validatePIN(pin);
    if (!pinValidation.valid) {
      return res.status(400).json({
        success: false,
        error: pinValidation.error
      });
    }

    // === CHECK USERNAME UNIQUENESS ===
    
    // TODO: Replace with your database query
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Username already exists'
      });
    }

    // === HASH CREDENTIALS ===
    
    const abbreviationHash = await bcrypt.hash(abbreviation.toLowerCase(), BCRYPT_ROUNDS);
    const pinHash = await bcrypt.hash(pin, BCRYPT_ROUNDS);

    // === GENERATE RECOVERY CODE (Optional) ===
    
    let recoveryCode = null;
    let recoveryCodeHash = null;
    
    if (generateRecoveryCode) {
      recoveryCode = generateRecoveryCode();
      recoveryCodeHash = await bcrypt.hash(recoveryCode, BCRYPT_ROUNDS);
    }

    // === INSERT USER INTO DATABASE ===
    
    // TODO: Replace with your database query
    const result = await db.query(
      `INSERT INTO users (
        username, 
        abbreviation_hash, 
        pin_hash, 
        recovery_code_hash,
        created_at
      ) VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, username, created_at`,
      [
        username.toLowerCase(),
        abbreviationHash,
        pinHash,
        recoveryCodeHash
      ]
    );

    const newUser = result.rows[0];

    // === SEND RECOVERY CODE TO EMAIL (Optional) ===
    
    let emailSent = false;
    if (email && recoveryCode) {
      try {
        await sendRecoveryEmail(email, recoveryCode, username);
        emailSent = true;
      } catch (emailError) {
        console.error('Failed to send recovery email:', emailError);
        // Don't fail registration if email fails
      }
    }

    // === RETURN SUCCESS RESPONSE ===
    
    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        username: newUser.username,
        recoveryCode: recoveryCode, // Only returned once!
        emailSent: emailSent,
        createdAt: newUser.created_at
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during registration'
    });
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * 
 * Request Body:
 * {
 *   username: string,
 *   abbreviation: string,
 *   pin: string
 * }
 */
exports.login = async (req, res) => {
  try {
    const { username, abbreviation, pin } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // === INPUT VALIDATION ===
    
    if (!username || !abbreviation || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Username, abbreviation, and PIN are required'
      });
    }

    // === RATE LIMITING CHECK ===
    
    // Check username-based rate limit
    const usernameRateLimit = await checkRateLimit(username, 'username');
    if (usernameRateLimit.blocked) {
      return res.status(429).json({
        success: false,
        error: 'Too many failed login attempts',
        lockedUntil: usernameRateLimit.lockedUntil,
        minutesRemaining: usernameRateLimit.minutesRemaining
      });
    }

    // Check IP-based rate limit
    const ipRateLimit = await checkRateLimit(clientIP, 'ip');
    if (ipRateLimit.blocked) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests from this IP address',
        minutesRemaining: ipRateLimit.minutesRemaining
      });
    }

    // === FETCH USER FROM DATABASE ===
    
    // TODO: Replace with your database query
    const result = await db.query(
      `SELECT 
        id, 
        username, 
        abbreviation_hash, 
        pin_hash,
        score,
        rank,
        games_played,
        failed_attempts,
        locked_until
      FROM users 
      WHERE username = $1`,
      [username.toLowerCase()]
    );

    // Use constant-time operations to prevent timing attacks
    const user = result.rows[0];
    const dummyHash = '$2b$12$dummyhashtopreventtimingattacks1234567890';

    // === CHECK ACCOUNT LOCK ===
    
    if (user && user.locked_until) {
      const lockedUntil = new Date(user.locked_until);
      const now = new Date();
      
      if (lockedUntil > now) {
        const minutesRemaining = Math.ceil((lockedUntil - now) / 60000);
        return res.status(423).json({
          success: false,
          error: 'Account locked due to too many failed attempts',
          lockedUntil: lockedUntil.toISOString(),
          minutesRemaining: minutesRemaining
        });
      } else {
        // Lock expired, unlock the account
        await db.query(
          'UPDATE users SET locked_until = NULL, failed_attempts = 0 WHERE id = $1',
          [user.id]
        );
        user.failed_attempts = 0;
      }
    }

    // === VERIFY CREDENTIALS ===
    
    // Always perform hash comparison to prevent timing attacks
    const abbreviationHash = user?.abbreviation_hash || dummyHash;
    const pinHash = user?.pin_hash || dummyHash;

    const abbreviationMatch = await bcrypt.compare(abbreviation.toLowerCase(), abbreviationHash);
    const pinMatch = await bcrypt.compare(pin, pinHash);

    // === HANDLE AUTHENTICATION RESULT ===
    
    if (!user || !abbreviationMatch || !pinMatch) {
      // Authentication failed
      
      // Record failed attempt
      await recordAttempt(username, 'username');
      await recordAttempt(clientIP, 'ip');

      if (user) {
        // Increment failed attempts
        const newFailedAttempts = (user.failed_attempts || 0) + 1;
        
        if (newFailedAttempts >= 3) {
          // Lock account for 1 hour
          const lockUntil = new Date();
          lockUntil.setHours(lockUntil.getHours() + 1);
          
          await db.query(
            'UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3',
            [newFailedAttempts, lockUntil, user.id]
          );

          return res.status(401).json({
            success: false,
            error: 'Invalid credentials. Account locked for 1 hour.',
            lockedUntil: lockUntil.toISOString(),
            minutesRemaining: 60
          });
        } else {
          // Update failed attempts
          await db.query(
            'UPDATE users SET failed_attempts = $1 WHERE id = $2',
            [newFailedAttempts, user.id]
          );

          const attemptsRemaining = 3 - newFailedAttempts;
          return res.status(401).json({
            success: false,
            error: 'Invalid credentials',
            attemptsRemaining: attemptsRemaining,
            message: `You have ${attemptsRemaining} attempt(s) remaining before account lock`
          });
        }
      }

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // === AUTHENTICATION SUCCESSFUL ===
    
    // Reset failed attempts
    await db.query(
      'UPDATE users SET failed_attempts = 0, last_login = NOW(), last_ip = $1 WHERE id = $2',
      [clientIP, user.id]
    );

    // Reset rate limits
    await resetAttempts(username, 'username');
    await resetAttempts(clientIP, 'ip');

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // === RETURN SUCCESS RESPONSE ===
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: token,
        user: {
          username: user.username,
          score: user.score,
          rank: user.rank,
          gamesPlayed: user.games_played
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during login'
    });
  }
};

/**
 * POST /api/auth/recover
 * Verify recovery code and issue reset token
 * 
 * Request Body:
 * {
 *   username: string,
 *   recoveryCode: string
 * }
 */
exports.recover = async (req, res) => {
  try {
    const { username, recoveryCode } = req.body;

    // === INPUT VALIDATION ===
    
    if (!username || !recoveryCode) {
      return res.status(400).json({
        success: false,
        error: 'Username and recovery code are required'
      });
    }

    // === FETCH USER FROM DATABASE ===
    
    const result = await db.query(
      'SELECT id, username, recovery_code_hash FROM users WHERE username = $1',
      [username.toLowerCase()]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.recovery_code_hash) {
      return res.status(400).json({
        success: false,
        error: 'No recovery code set for this account'
      });
    }

    // === VERIFY RECOVERY CODE ===
    
    const recoveryCodeMatch = await bcrypt.compare(
      recoveryCode.toUpperCase(),
      user.recovery_code_hash
    );

    if (!recoveryCodeMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid recovery code'
      });
    }

    // === GENERATE TEMPORARY RESET TOKEN ===
    
    // Generate a temporary token valid for 15 minutes
    const resetToken = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        purpose: 'reset'
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // === RETURN SUCCESS RESPONSE ===
    
    return res.status(200).json({
      success: true,
      message: 'Recovery code verified',
      data: {
        resetToken: resetToken,
        expiresIn: '15 minutes'
      }
    });

  } catch (error) {
    console.error('Recovery error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during recovery'
    });
  }
};

/**
 * POST /api/auth/reset
 * Reset user credentials after recovery verification
 * 
 * Headers:
 * Authorization: Bearer <reset_token>
 * 
 * Request Body:
 * {
 *   newAbbreviation: string,
 *   newPin: string,
 *   generateNewRecoveryCode: boolean (optional),
 *   email: string (optional)
 * }
 */
exports.reset = async (req, res) => {
  try {
    const { newAbbreviation, newPin, generateNewRecoveryCode, email } = req.body;

    // === VERIFY RESET TOKEN ===
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Reset token required'
      });
    }

    const resetToken = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
      
      if (decoded.purpose !== 'reset') {
        throw new Error('Invalid token purpose');
      }
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // === VALIDATE NEW CREDENTIALS ===
    
    const abbreviationValidation = validateAbbreviation(newAbbreviation, decoded.username);
    if (!abbreviationValidation.valid) {
      return res.status(400).json({
        success: false,
        error: abbreviationValidation.error
      });
    }

    const pinValidation = validatePIN(newPin);
    if (!pinValidation.valid) {
      return res.status(400).json({
        success: false,
        error: pinValidation.error
      });
    }

    // === HASH NEW CREDENTIALS ===
    
    const newAbbreviationHash = await bcrypt.hash(newAbbreviation.toLowerCase(), BCRYPT_ROUNDS);
    const newPinHash = await bcrypt.hash(newPin, BCRYPT_ROUNDS);

    // === GENERATE NEW RECOVERY CODE (Optional) ===
    
    let newRecoveryCode = null;
    let newRecoveryCodeHash = null;
    
    if (generateNewRecoveryCode) {
      newRecoveryCode = generateRecoveryCode();
      newRecoveryCodeHash = await bcrypt.hash(newRecoveryCode, BCRYPT_ROUNDS);
    }

    // === UPDATE DATABASE ===
    
    await db.query(
      `UPDATE users 
      SET 
        abbreviation_hash = $1,
        pin_hash = $2,
        recovery_code_hash = $3,
        failed_attempts = 0,
        locked_until = NULL
      WHERE id = $4`,
      [newAbbreviationHash, newPinHash, newRecoveryCodeHash, decoded.userId]
    );

    // === SEND NEW RECOVERY CODE TO EMAIL (Optional) ===
    
    let emailSent = false;
    if (email && newRecoveryCode) {
      try {
        await sendRecoveryEmail(email, newRecoveryCode, decoded.username);
        emailSent = true;
      } catch (emailError) {
        console.error('Failed to send recovery email:', emailError);
      }
    }

    // === RETURN SUCCESS RESPONSE ===
    
    return res.status(200).json({
      success: true,
      message: 'Credentials reset successfully',
      data: {
        username: decoded.username,
        newRecoveryCode: newRecoveryCode,
        emailSent: emailSent
      }
    });

  } catch (error) {
    console.error('Reset error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during password reset'
    });
  }
};

/**
 * POST /api/auth/send-recovery-email
 * Send recovery code to email (email NOT stored)
 * 
 * Request Body:
 * {
 *   username: string,
 *   recoveryCode: string,
 *   email: string
 * }
 */
exports.sendRecoveryEmailEndpoint = async (req, res) => {
  try {
    const { username, recoveryCode, email } = req.body;

    // === INPUT VALIDATION ===
    
    if (!username || !recoveryCode || !email) {
      return res.status(400).json({
        success: false,
        error: 'Username, recovery code, and email are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // === VERIFY USER AND RECOVERY CODE ===
    
    const result = await db.query(
      'SELECT id, recovery_code_hash FROM users WHERE username = $1',
      [username.toLowerCase()]
    );

    const user = result.rows[0];

    if (!user || !user.recovery_code_hash) {
      return res.status(404).json({
        success: false,
        error: 'User not found or no recovery code set'
      });
    }

    // Verify recovery code
    const recoveryCodeMatch = await bcrypt.compare(
      recoveryCode.toUpperCase(),
      user.recovery_code_hash
    );

    if (!recoveryCodeMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid recovery code'
      });
    }

    // === SEND EMAIL ===
    
    try {
      await sendRecoveryEmail(email, recoveryCode, username);
      
      // EMAIL IS NOT STORED - immediately forgotten after sending
      
      return res.status(200).json({
        success: true,
        message: 'Recovery code sent to email',
        note: 'We do NOT store your email. This is a one-time delivery.'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Failed to send email'
      });
    }

  } catch (error) {
    console.error('Send recovery email error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred'
    });
  }
};

module.exports = exports;
