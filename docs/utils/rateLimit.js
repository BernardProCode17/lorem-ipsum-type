/**
 * Rate Limiting Utilities
 * Handles rate limiting for login attempts
 * Can use Redis for production or in-memory store for development
 */

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map();

/**
 * Configuration
 */
const RATE_LIMIT_CONFIG = {
  username: {
    maxAttempts: 3,
    windowMinutes: 60, // 1 hour
    lockMinutes: 60 // Lock for 1 hour after max attempts
  },
  ip: {
    maxAttempts: 10,
    windowMinutes: 60,
    lockMinutes: 60
  }
};

/**
 * Check if identifier is rate limited
 * 
 * @param {string} identifier - Username or IP address
 * @param {string} type - 'username' or 'ip'
 * @returns {Promise<object>} { blocked: boolean, attemptsRemaining: number, lockedUntil: Date, minutesRemaining: number }
 */
async function checkRateLimit(identifier, type) {
  const config = RATE_LIMIT_CONFIG[type] || RATE_LIMIT_CONFIG.username;
  const key = `${type}:${identifier}`;
  
  // Get rate limit data from store
  const data = rateLimitStore.get(key);
  
  if (!data) {
    // No attempts recorded yet
    return {
      blocked: false,
      attemptsRemaining: config.maxAttempts,
      lockedUntil: null,
      minutesRemaining: 0
    };
  }

  const now = new Date();
  const windowStart = new Date(data.windowStart);
  const windowEnd = new Date(windowStart.getTime() + (config.windowMinutes * 60 * 1000));

  // Check if window has expired
  if (now > windowEnd) {
    // Window expired, reset
    rateLimitStore.delete(key);
    return {
      blocked: false,
      attemptsRemaining: config.maxAttempts,
      lockedUntil: null,
      minutesRemaining: 0
    };
  }

  // Check if locked
  if (data.lockedUntil) {
    const lockedUntil = new Date(data.lockedUntil);
    
    if (now < lockedUntil) {
      // Still locked
      const minutesRemaining = Math.ceil((lockedUntil - now) / 60000);
      return {
        blocked: true,
        attemptsRemaining: 0,
        lockedUntil: lockedUntil,
        minutesRemaining: minutesRemaining
      };
    } else {
      // Lock expired, reset
      rateLimitStore.delete(key);
      return {
        blocked: false,
        attemptsRemaining: config.maxAttempts,
        lockedUntil: null,
        minutesRemaining: 0
      };
    }
  }

  // Check attempts count
  const attemptsRemaining = config.maxAttempts - data.attempts;
  
  if (attemptsRemaining <= 0) {
    // Max attempts reached, lock account
    const lockedUntil = new Date(now.getTime() + (config.lockMinutes * 60 * 1000));
    
    data.lockedUntil = lockedUntil;
    rateLimitStore.set(key, data);
    
    return {
      blocked: true,
      attemptsRemaining: 0,
      lockedUntil: lockedUntil,
      minutesRemaining: config.lockMinutes
    };
  }

  return {
    blocked: false,
    attemptsRemaining: attemptsRemaining,
    lockedUntil: null,
    minutesRemaining: 0
  };
}

/**
 * Record a failed attempt
 * 
 * @param {string} identifier - Username or IP address
 * @param {string} type - 'username' or 'ip'
 * @returns {Promise<void>}
 */
async function recordAttempt(identifier, type) {
  const key = `${type}:${identifier}`;
  const now = new Date();
  
  let data = rateLimitStore.get(key);
  
  if (!data) {
    // First attempt
    data = {
      identifier: identifier,
      type: type,
      attempts: 1,
      windowStart: now,
      lockedUntil: null
    };
  } else {
    // Increment attempts
    data.attempts += 1;
  }
  
  rateLimitStore.set(key, data);
}

/**
 * Reset attempts for identifier (after successful login)
 * 
 * @param {string} identifier - Username or IP address
 * @param {string} type - 'username' or 'ip'
 * @returns {Promise<void>}
 */
async function resetAttempts(identifier, type) {
  const key = `${type}:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * Clean up expired rate limit records
 * Should be called periodically (e.g., every 5 minutes)
 * 
 * @returns {Promise<number>} Number of records cleaned up
 */
async function cleanupExpiredRecords() {
  const now = new Date();
  let cleaned = 0;

  for (const [key, data] of rateLimitStore.entries()) {
    const windowStart = new Date(data.windowStart);
    const config = RATE_LIMIT_CONFIG[data.type] || RATE_LIMIT_CONFIG.username;
    const windowEnd = new Date(windowStart.getTime() + (config.windowMinutes * 60 * 1000));

    // Check if window expired and not locked
    if (now > windowEnd && (!data.lockedUntil || now > new Date(data.lockedUntil))) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Get current rate limit status (for monitoring/debugging)
 * 
 * @param {string} identifier - Username or IP address
 * @param {string} type - 'username' or 'ip'
 * @returns {Promise<object|null>}
 */
async function getRateLimitStatus(identifier, type) {
  const key = `${type}:${identifier}`;
  const data = rateLimitStore.get(key);
  
  if (!data) {
    return null;
  }

  return {
    identifier: data.identifier,
    type: data.type,
    attempts: data.attempts,
    windowStart: data.windowStart,
    lockedUntil: data.lockedUntil
  };
}

// ============================================
// REDIS VERSION (for production)
// ============================================

/**
 * Redis-based rate limiting implementation
 * Uncomment and use this in production for better performance and scalability
 */

/*
const Redis = require('redis');
const redisClient = Redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

async function checkRateLimitRedis(identifier, type) {
  const config = RATE_LIMIT_CONFIG[type] || RATE_LIMIT_CONFIG.username;
  const key = `ratelimit:${type}:${identifier}`;
  
  const data = await redisClient.get(key);
  
  if (!data) {
    return {
      blocked: false,
      attemptsRemaining: config.maxAttempts,
      lockedUntil: null,
      minutesRemaining: 0
    };
  }
  
  const parsed = JSON.parse(data);
  const now = new Date();
  
  // Check if locked
  if (parsed.lockedUntil) {
    const lockedUntil = new Date(parsed.lockedUntil);
    
    if (now < lockedUntil) {
      const minutesRemaining = Math.ceil((lockedUntil - now) / 60000);
      return {
        blocked: true,
        attemptsRemaining: 0,
        lockedUntil: lockedUntil,
        minutesRemaining: minutesRemaining
      };
    } else {
      // Lock expired
      await redisClient.del(key);
      return {
        blocked: false,
        attemptsRemaining: config.maxAttempts,
        lockedUntil: null,
        minutesRemaining: 0
      };
    }
  }
  
  const attemptsRemaining = config.maxAttempts - parsed.attempts;
  
  return {
    blocked: attemptsRemaining <= 0,
    attemptsRemaining: Math.max(0, attemptsRemaining),
    lockedUntil: null,
    minutesRemaining: 0
  };
}

async function recordAttemptRedis(identifier, type) {
  const config = RATE_LIMIT_CONFIG[type] || RATE_LIMIT_CONFIG.username;
  const key = `ratelimit:${type}:${identifier}`;
  const now = new Date();
  
  const data = await redisClient.get(key);
  let parsed;
  
  if (!data) {
    parsed = {
      attempts: 1,
      windowStart: now.toISOString(),
      lockedUntil: null
    };
  } else {
    parsed = JSON.parse(data);
    parsed.attempts += 1;
    
    // Check if max attempts reached
    if (parsed.attempts >= config.maxAttempts) {
      const lockedUntil = new Date(now.getTime() + (config.lockMinutes * 60 * 1000));
      parsed.lockedUntil = lockedUntil.toISOString();
    }
  }
  
  // Store with TTL
  const ttl = config.windowMinutes * 60; // Convert to seconds
  await redisClient.setex(key, ttl, JSON.stringify(parsed));
}

async function resetAttemptsRedis(identifier, type) {
  const key = `ratelimit:${type}:${identifier}`;
  await redisClient.del(key);
}
*/

module.exports = {
  checkRateLimit,
  recordAttempt,
  resetAttempts,
  cleanupExpiredRecords,
  getRateLimitStatus,
  RATE_LIMIT_CONFIG
};
